---
layout: home

hero:
  name: LibEntity
  text: Type-safe, state-driven metamodel for Java
  tagline: Build robust domain logic with less code and more confidence.
  actions:
    - theme: brand
      text: Get Started
      link: /guide
    - theme: alt
      text: View on GitHub
      link: https://github.com/vuejs/vitepress

features:
  - icon: 🔒
    title: Type-safe DSL
    details: Build entities with a fluent, type-safe DSL that catches errors at compile time
  - icon: 🔄
    title: State Machine Transitions
    details: Define clear state transitions and validations for your business entities
  - icon: ✅
    title: Bring your own Validation
    details: Comprehensive validation system with easy error handling
  - icon: 🎯
    title: Action-based Commands
    details: Clean command pattern implementation for all entity operations
---

## Quick Example

Use the LibEntity [Java DSL](/concepts/) to define your entities, transitions, actions, and validators. LibEntity also offers an [annotation-based](/integrations/annotations/) DSL for defining entity types, actions, and validators.


::: code-group

```java [JavaDsl.java]
public enum InvoiceState {
    DRAFT,
    PENDING,
    APPROVED,
    REJECTED
}

@Data
static class Invoice {
    private BigDecimal amount;
    private BigDecimal vat;
    private boolean readyForApproval;
    private String submitterId;
    private String submitterDeviceId;
    private String approverId;
    private String approvalComment;
}

@Data
static class SubmitInvoiceCommand implements ActionCommand {
    private String submitterId;
    private String submitterDeviceId;
    @Override
    public String getActionName() { return "submit"; }
}

// ... 

var invoiceEntityType = EntityType.<InvoiceState, InvoiceRequest>builder("Invoice")
    .field("amount", BigDecimal.class, f -> f
        .validateInState(InvoiceState.DRAFT, (state, request, ctx) -> {
            if (request.invoice().getAmount() != null && request.invoice().getAmount().compareTo(new BigDecimal("10000")) > 0) {
                ctx.addError("AMOUNT_TOO_LARGE", "Amount cannot exceed 10,000");
            }
        })
    )
    .field("vat",
           BigDecimal.class, f -> 
           f.validateInState(InvoiceState.DRAFT, (state, request, ctx) -> {
                if (request.invoice().getVat() == null) {
                    ctx.addError("VAT_REQUIRED", "VAT is required");
                }
            })
    ).<SubmitInvoiceCommand>action("submit", a ->
            a.allowedStates(Set.of(InvoiceState.DRAFT))
             .commandType(SubmitInvoiceCommand.class)
             .onlyIf((state, request, command) ->
                request.invoice().getAmount() != null
                    && request.invoice().getAmount().compareTo(BigDecimal.ZERO) > 0
                    && request.invoice().getAmount().compareTo(new BigDecimal("10000")) <= 0)
        .handler((state, request, command, mutator) -> {
            request.invoice().setReadyForApproval(true);
            request.invoice().setSubmitterId(command.getSubmitterId());
            request.invoice().setSubmitterDeviceId(command.getSubmitterDeviceId());
            mutator.setState(InvoiceState.PENDING_APPROVAL);
        }))
    // ... 
    .build();
```

```java [AnnotationDsl.java]
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

:::
## Why LibEntity?

A [metamodel](https://en.wikipedia.org/wiki/Metamodeling) is what allows you to move fast. Most systems are "literal", that means they are too granular, and you end up with a lot of code, a lot of testing surface, and a lot of maintenance burdern that blocks your business to react fast. LibEntity metamodel is a balance between granularity and simplicity.

While not a new concept, LibEntity's metamodel is a unique take on the idea that provides a powerful yet simple way structure your applications by packing years of experience in a simple and declarative DSL.

[Get started](/guide) with LibEntity today!

