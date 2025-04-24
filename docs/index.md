---
layout: home

hero:
  name: LibEntity
  text: Type-safe, state-driven business entity metamodel for Java
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

A [metamodel](https://en.wikipedia.org/wiki/Metamodeling) is what allows you to move fast. Most systems are "literal", that means they are too granular, and you end up with a lot of code, a lot of testing surface, and a lot of maintenance burdern that blocks your business to react fast. LibEntity metamodel is a balance between granularity and simplicity.

While not a new concept, LibEntity's metamodel is a unique take on the idea that provides a powerful yet simple way structure your applications by packing years of experience in a simple and declarative DSL.

[Get started](/guide) with LibEntity today!
