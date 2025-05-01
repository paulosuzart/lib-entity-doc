# Annotation Support Module

This module provides an annotation-based DSL for defining entity types, actions, and validators for the LibEntity framework. It offers a declarative, beginner-friendly alternative to the builder-style DSL found in the `library` module, enabling rapid and readable configuration using Java annotations.

## Quick Comparison: Annotation DSL vs. Core DSL

| Feature                   | Annotation DSL (This Module)                                      | Core DSL (`library` module)                                    |
|--------------------------|-------------------------------------------------------------------|----------------------------------------------------------------|
| **Entity Definition**     | `@EntityDefinition` on class, fields/actions as annotation attrs   | `EntityType.builder("...")` with chained `.field(...)`, etc.  |
| **Field Definition**      | `@Field` array in `@EntityDefinition(fields = {...})`             | `.field("name", Type.class, f -> f.validateInState(...))`     |
| **Validator Definition**  | `validators` in `@Field`, `inStateValidators`, `transitionValidators` in `@EntityDefinition` | `.validateInState(...)`, `.validateStateTransition(...)`        |
| **Action Definition**     | `@Action` in `actions` in `@EntityDefinition`, handler class with `@Handle` and `@OnlyIf` methods | `.action("name", ActionBuilder.forHandler(...).onlyIf(...).build("name"))` |
| **Command Type**          | POJO with `@EntityCommand(action = "...")`                      | Any class implementing `ActionCommand`                          |
| **Allowed States**        | `@Action(allowedStates = {"STATE"})` in `@EntityDefinition`      | `.allowedStates(EnumSet.of(...))` in builder                    |
| **Availability Predicate**| `@OnlyIf` method in action handler                                | `.onlyIf(...)` in action builder                                |
| **Extensibility**         | Add new annotations, handler classes, or validators               | Compose new builder chains, extend builder/entity classes       |

::: tip No More Boilerplate!
With the annotation-based DSL, your command objects **do not need to implement any interfaces**. Just annotate your POJO with `@EntityCommand` and you're done!

- No more empty `getActionName()` methods.
- No more marker interfaces.
- Cleaner, more idiomatic Java code.
:::

---

## Example: Annotation-Based Entity Definition (Payment Domain)

```java
// 1. State Enum
enum PaymentState {
    DRAFT,
    PENDING_APPROVAL,
    APPROVED
}

// 2. Request and Command Types
@Data
@AllArgsConstructor
class PaymentRequest {
    private final int amount;
}

@EntityCommand(action = "submitPayment")
@Data
@AllArgsConstructor
class SubmitPaymentCommand {
    private final String submitDate;
    private final String submitterId;
}

// 3. Action Handler
public class PaymentActionHandler {
    @Handle
    public void handle(PaymentState state, PaymentRequest request, SubmitPaymentCommand command) {
        // Implement state mutation logic if needed
    }

    @OnlyIf
    public boolean canSubmit(PaymentState state, PaymentRequest request, SubmitPaymentCommand command) {
        return request.getAmount() > 0;
    }
}

// 4. Entity Definition
@EntityDefinition(
    name = "Payment",
    stateEnum = PaymentState.class,
    fields = {
        @Field(
            name = "amount",
            type = int.class,
            required = true,
            validators = {SampleAmountValidator.class}
        )
    },
    actions = {
        @Action(name = "submitPayment", description = "Submit a payment", handler = PaymentActionHandler.class)
    },
    inStateValidators = {SampleAmountValidator.class},
    transitionValidators = {SampleTransitionValidator.class}
)
public class PaymentEntityConfig {}
```

## Example: Core (Builder) DSL

```java
EntityType<PaymentState, PaymentRequest> paymentType = EntityType.builder("Payment")
    .action("submitPayment", ActionBuilder
        .forHandler((state, request, command, mutator) -> mutator.setState(PaymentState.APPROVED))
        .onlyIf((state, request, command) -> request.getAmount() > 0)
        .allowedStates(EnumSet.of(PaymentState.DRAFT))
        .build("submitPayment")
    )
    .build();
```

---

## Features
- **Declarative Action & Validator Registration:** Define actions, guards, and validators using simple annotations.
- **Command Flexibility:** Commands can be POJOs with `@EntityCommand`, no need to implement interfaces.
- **Type Safety:** The processor checks handler signatures and state names at build time.
- **Integration:** Outputs real `EntityType` objects compatible with the core engine.

## How It Works
- Annotate your handler and validator classes/methods.
- The annotation processor scans for these annotations and builds a registry of entity types and actions.
- At runtime, actions and validators are invoked via reflection and proxies, ensuring compatibility with the core engine.

## Why No Interface Requirement Is a Big Deal

- **Less Boilerplate:** Your commands can be plain Java classes—no need for extra methods or inheritance.
- **Easier Refactoring:** Rename, move, or refactor your commands freely without breaking contracts.
- **Better Integration:** Works seamlessly with records, Lombok, and other POJO-friendly tools.
- **Framework Agnostic:** Your domain model stays decoupled from framework interfaces.

## When to Use
- Prefer this module if you want a quick, annotation-driven, and beginner-friendly way to define entities.
- Use the builder DSL for maximum flexibility, advanced composition, or meta-programming.

## :warning: Limitations
- `allowedStates` in annotations must be strings due to Java annotation restrictions (see docs for rationale).
- For maximum type safety, use the builder DSL.

## Requirements for Annotated Methods

When using the annotation-based DSL, your handler and validator methods must follow strict signature requirements to ensure correct processing. Here are the requirements for each type:

### @Handle Methods
- Must have **exactly 4 parameters** in this order:
  1. The state enum type (e.g., `PaymentState`)
  2. The request type (e.g., `PaymentRequest`)
  3. The command type (as defined in your `@Action(command = ...)`)
  4. A `StateMutator` (from the framework)
- **Example:**
  ```java
  @Handle
  public void handle(PaymentState state, 
                     PaymentRequest req, 
                     SubmitPaymentCommand cmd, 
                     StateMutator<PaymentState> mutator) {
      // ...
  }
  ```
- **Common error:** Wrong parameter count or wrong types/order will result in an error: `@Handle method must have exactly 4 parameters (state, request, command, mutator)`

### In-State Validator Methods
- Must have **exactly 3 parameters** in this order:
  1. The state enum type
  2. The request type
  3. The validation context (usually `ValidationContext`)
- **Example:**
  ```java
  public void validate(PaymentState state, PaymentRequest req, ValidationContext ctx) {
      // ...
  }
  ```
- **Common error:** Wrong parameter count or wrong types/order will result in an error: `InStateValidator 'validate' method must have exactly 3 parameters (state, request, ctx)`

### Transition Validator Methods
- Must have **exactly 4 parameters** in this order:
  1. From-state (state enum type)
  2. To-state (state enum type)
  3. The request type
  4. The validation context (usually `ValidationContext`)
- **Example:**
  ```java
  public void validate(PaymentState from, PaymentState to, PaymentRequest req, ValidationContext ctx) {
      // ...
  }
  ```
- **Common error:** Wrong parameter count or wrong types/order will result in an error: `TransitionValidator 'validate' method must have exactly 4 parameters (from, to, request, ctx)`

### Troubleshooting
- If you see errors about parameter counts or types, double-check your method signatures against the above requirements.
- All types must match exactly (including generics if used).
- For more advanced usage or to bypass annotation restrictions, use the builder DSL in the core module.


### Using with Spring

To integrate with Spring, you can provide an instance factory that looks up beans from the Spring `ApplicationContext`. This allows your handlers and validators to be regular Spring beans with full dependency injection:

```java
import org.springframework.context.ApplicationContext;

ApplicationContext applicationContext = ...; // inject or obtain context
EntityAnnotationProcessor processor = new EntityAnnotationProcessor(clazz -> applicationContext.getBean(clazz));
```

Register your action handlers and validators as `@Component` or `@Service` beans. The processor will use Spring to instantiate and inject dependencies as needed.

*In the future, a dedicated `annotation-support-spring` module may be provided for even smoother integration.*


---

*This module is designed to lower the barrier to entry for new users and speed up development for common entity patterns. Contributions and feedback welcome!*