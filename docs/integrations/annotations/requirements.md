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
  public void handle(PaymentState state, PaymentRequest req, SubmitPaymentCommand cmd, StateMutator mutator) {
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
