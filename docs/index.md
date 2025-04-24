---
layout: home

hero:
  name: LibEntity
  text: Type-safe, state-driven business entities for Java
  tagline: Build robust domain logic with less code and more confidence. Perfect for teams who value both flexibility and productivity.
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

```java
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

// ... (other command classes omitted for brevity)

EntityType<InvoiceState, Invoice, Object> invoiceType = EntityType.<InvoiceState, Invoice, Object>builder("Invoice")
    .field("amount", BigDecimal.class, f -> f
        .validateInState(InvoiceState.DRAFT, (state, entityData, request, ctx) -> {
            if (entityData.getAmount() != null && entityData.getAmount().compareTo(new BigDecimal("10000")) > 0) {
                ctx.addError("AMOUNT_TOO_LARGE", "Amount cannot exceed 10,000");
            }
        })
    )
    .field("vat", BigDecimal.class, f -> f
        .validateInState(InvoiceState.DRAFT, (state, entityData, request, ctx) -> {
            if (entityData.getVat() == null || entityData.getVat().compareTo(BigDecimal.ZERO) < 0) {
                ctx.addError("VAT_INVALID", "VAT cannot be negative");
            }
        })
    )
    .action("submit", a -> a
        .description("Submit invoice for approval")
        .allowedStates(Set.of(InvoiceState.DRAFT))
        .onlyIf(entityData -> entityData.getAmount() != null && entityData.getAmount().compareTo(BigDecimal.ZERO) > 0)
        .commandType(SubmitInvoiceCommand.class)
        .handler((state, request, command, entityData, mutator) -> {
            entityData.setReadyForApproval(true);
            entityData.setSubmitterId(command.getSubmitterId());
            entityData.setSubmitterDeviceId(command.getSubmitterDeviceId());
            mutator.setState(InvoiceState.PENDING);
        })
    )
    // ... (other actions omitted for brevity)
    .build();
```

## Why LibEntity?

LibEntity helps you build robust business applications by providing:

- **Type Safety**: Catch errors at compile time, not runtime
- **Clean Architecture**: Separate business logic from infrastructure
- **Flexible Validation**: Custom rules and error handling
- **State Management**: Built-in state machine with transitions
- **Spring Integration**: Ready for enterprise applications
- **Dynamic Filters**: LibEntity brings structure to dynamic filters by providing a flexible, type-safe filter system.

[Get started](/guide) with LibEntity today!
