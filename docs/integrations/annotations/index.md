# Annotation Support Module

This module provides an annotation-based DSL for defining entity types, actions, and validators for the LibEntity framework. It offers a declarative, beginner-friendly alternative to the builder-style DSL found in the `library` module, enabling rapid and readable configuration using Java annotations.

## Quick Comparison: Annotation DSL vs. Core DSL

| Feature               | Annotation DSL (This Module)                      | Core DSL (`library` module)                 |
|----------------------|---------------------------------------------------|---------------------------------------------|
| Entity Definition    | `@ActionHandlerFor(entity = ...)`                  | `EntityType.builder("...")`                |
| Action Definition    | `@Handle`, `@Action`, `@OnlyIf` on methods        | `.action("name", ...)`                      |
| Validator Definition | `@InStateValidator`, `@TransitionValidator`       | `.inStateValidator(...)`, `.transitionValidator(...)` |
| Command Type         | POJO + `@EntityCommand(action = ...)`             | Must implement `ActionCommand` interface    |
| Allowed States       | `@Action(allowedStates = {"STATE"})`             | `.allowedStates(EnumSet.of(...))`           |
| Extensibility        | Add new annotations or handlers                   | Extend builder or entity classes            |

---

## Example: Annotation-Based Entity Definition

```java
@ActionHandlerFor(entity = "Invoice")
public class InvoiceActionHandler {
    @Handle
    @Action(name = "submitInvoice", allowedStates = {"DRAFT"})
    public void handle(InvoiceState state, InvoiceRequest request, SubmitInvoiceCommand command, StateMutator<InvoiceState> mutator) {
        mutator.setState(InvoiceState.PENDING_APPROVAL);
    }

    @OnlyIf
    @Action(name = "submitInvoice")
    public boolean canSubmit(InvoiceState state, InvoiceRequest request, SubmitInvoiceCommand command) {
        return request.getAmount() > 0;
    }
}

@EntityCommand(action = "submitInvoice")
@Data
@AllArgsConstructor
public class SubmitInvoiceCommand {
    private final String submitDate;
    private final String submitterId;
}
```

## Example: Core (Builder) DSL

```java
EntityType<InvoiceState, InvoiceRequest> invoiceType = EntityType.builder("Invoice")
    .action("submitInvoice", ActionBuilder
        .forHandler((state, request, command, mutator) -> mutator.setState(InvoiceState.PENDING_APPROVAL))
        .onlyIf((state, request, command) -> request.getAmount() > 0)
        .allowedStates(EnumSet.of(InvoiceState.DRAFT))
        .build("submitInvoice")
    )
    .build();
```

## Executing Actions on Annotated Entities

The `annotation-support` module offers a `EntityProcessor` capable of scanning your classes and generating the `EntityType` from these classes. 

::: warning
Some validations are enforced during stacan time. It's recommended to scan the classes during tests and the startup of your application.
:::

You need to create an instance of `EntityAnnotationProcessor` and call `buildEntityTypes` method. The method returns a map of entity types that cane buse later used by the `ActionExecutor`.

```java
    @Test
    public void testSyncActionExecutorExecutesSampleAction() {
        // Build EntityType from annotation processor
        EntityAnnotationProcessor processor = new EntityAnnotationProcessor();
        Map<String, EntityType<?, ?>> entityTypes = processor.buildEntityTypes("com.libentity.annotation.processor");
        EntityType<TestInvoiceState, InvoiceRequest> entityType = (EntityType<TestInvoiceState, InvoiceRequest>) entityTypes.get("Invoice");

        // Prepare executor
        SyncActionExecutor<TestInvoiceState, InvoiceRequest> executor = new SyncActionExecutor<>(entityType);
        ValidationContext ctx = new ValidationContext();
        TestInvoiceState initialState = TestInvoiceState.DRAFT;
        InvoiceRequest request = new InvoiceRequest("INV-123", 100.0);
        SubmitInvoiceCommand cmd = new SubmitInvoiceCommand("2025-04-26", "user-123");
        // Execute
        var result = executor.execute(initialState, request, ctx, cmd);
        // Assert state transition
        assertEquals(TestInvoiceState.PENDING_APPROVAL, result.getState());
        assertEquals("INV-123", result.getRequest().getInvoiceNumber());
        assertEquals(100.0, result.getRequest().getAmount());
        // Assert command payload
        SubmitInvoiceCommand actualCmd = (SubmitInvoiceCommand) result.getCommand();
        assertEquals("2025-04-26", actualCmd.getSubmitDate());
        assertEquals("user-123", actualCmd.getSubmitterId());
    }
```
::: info
By default EntityAnnotationProcessor uses reflection to instantiate the actions and validators. You can provide a custom instance factory to use a different method.
You can use LibEntity's [instance factory](/integrations/annotations/instance-factory.md) for this purpose and have limitless options.
:::


## Features
- **Declarative Action & Validator Registration:** Define actions, guards, and validators using simple annotations.
- **Command Flexibility:** Commands can be POJOs with `@EntityCommand`, no need to implement interfaces.
- **Type Safety:** The processor checks handler signatures and state names at build time.
- **Integration:** Outputs real `EntityType` objects compatible with the core engine.
- **Custom Instance Factory:** The processor can be configured to use a custom instance factory for creating entities. See [Instance Factories for Actions and Validators](./instance-factory.md).

## How It Works
- Annotate your handler and validator classes/methods.
- The annotation processor scans for these annotations and builds a registry of entity types and actions.
- At runtime, actions and validators are invoked via reflection and proxies, ensuring compatibility with the core engine.

## When to Use
- Prefer this module if you want a quick, annotation-driven, and beginner-friendly way to define entities.
- Use the builder DSL for maximum flexibility, advanced composition, or meta-programming.

## :warning: Limitations
- `allowedStates` in annotations must be strings due to Java annotation restrictions (see docs for rationale).
- There's currently no special annotations for field declarations.
- For maximum type safety, flexibility and dynamicity, use the builder DSL.

---

*This module is designed to lower the barrier to entry for new users and speed up development for common entity patterns. Contributions and feedback welcome!*