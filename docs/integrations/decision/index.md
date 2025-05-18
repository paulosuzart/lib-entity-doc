# LibEntity Decision

## Overview
LibEntity Decision is a decision engine that can be used to make decisions based on business rules. 

Given the action and transition structure, one can use ordinary java code to implement the business rules. But over time, rules tend to fall through the cracks and become obscure, hard to maintain and understand.

LibEntity Decision addresses this issue by providing a decision engine somewhat inspired by [decisions4s](https://business4s.org/decisions4s/).

## Example


### Setup
Make sure to include the annotation processor in your build tool.

Grandle:
```groovy
annotationProcessor 'com.libentity:lib-entity-decision:<latest-version>
```

### Define your input type

Similar to decisions4s, you can define your input type using a class.

```java
@AllArgsConstructor
@DecisionInput
public class InvoiceInput {
    Rule<String> requesterId;
    Rule<LocalDate> isDateSet;
    Rule<BigDecimal> amount;
    Rule<String> isApproved;
}
```

The `@DecisionInput` annotation will generate a value class and a `InputProvider` interface implementation. More on that later.

### Create your rules

The `Rule` type is a type-safe way to define rules for each attribute of the input type. Here is how to define a series of `MatchingRules` that will be used by our decision table.

```java
var blockedRequesters = Set.of(
    UUID.randomUUID().toString(), 
    UUID.randomUUID().toString(), 
    "98c8627c-2203-4f0b-8d0a-adea7150f6c6");

var rules = List.of(
    MatchingRule.of(
            new InvoiceInput(
                    // in matches if the attribute is in the set
                    in(blockedRequesters),
                    // it is true if the attribute is present
                    isSet(),
                    // gt fo greater than
                    gt(BigDecimal.valueOf(0.0)),
                    any()),
            // This is the expected output that can be any object
            Boolean.FALSE,
            inputProvider),
    MatchingRule.of(
            new InvoiceInput(
                    // catch all
                    any(),
                    // catch all
                    any(),
                    // grater than 1.0
                    gt(BigDecimal.valueOf(1.0)),
                    // catch all
                    any()),
            Boolean.TRUE,
            inputProvider));
```

### Evaluate

With the rules at hand, we can create a decision table.

```java
var decisionTable = DecisionTable.of(rules);
```

And finally, we can use the decision table to make decisions.

```java
var decision = decisionTable.evaluate(
        new InvoiceInputValue(
                "a0834601-041b-4837-a2fd-293802cc255f",
                LocalDate.now(),
                BigDecimal.valueOf(1.0),
                "true"),
        EvaluationPolicy.First); // EvaluationPolicy.First will return the first matching rule output

if (decision instanceof DecisionResult.First<Boolean, InvoiceInputValue> out) {
    if (out.getOutput().isEmpty()
            || Boolean.FALSE.equals(out.getOutput().get())) {
        throw new RuntimeException("Create invoice failed due to decision table: " + out.getOutput());
    }
}
```

## Diagnose

The decision table result can be inspected by calling `decision.diagnose()`. The output should be similar to:

```
Hit Policy: First
Result: Optional[true]
Input: 
  requesterId: user1
  isDateSet: 2025-05-28
  amount: 100
  isApproved: null
Rule 0 [f]:
  requesterId  [f]: in( 0e9a2aed-741e-47a9-b0f2-357e2621f8a3, 777ea383-3f6e-4c9c-b8e7-d02cb37f5bc1, 98c8627c-2203-4f0b-8d0a-adea7150f6c6 )
  isDateSet    [f]: isSet
  amount       [f]: > 0.0
  isApproved   [f]: -
Rule 1 [t]:
  requesterId  [t]: -
  isDateSet    [t]: -
  amount       [t]: > 1.0
  isApproved   [t]: -
  ```

  The way to read is as follows:

  - `Hit Policy`: `First` means that the first matching rule output will be used as the final result of the evaluation.
  - `Result`: `Optional[true]` means that the first matching rule output was `true`.
  - `Input`: Outputs the  values given to the decision table.
  - `Rule x` [f/t]: For each `MatchingRule` outputs each attribute match result. `f` means false and `t` means true.

## Evaluation Policies

LibEntity Decision provides a few evaluation policies:

- `First`: Returns the first matching rule output.
- `Unique`: Returns the first matching rule as long as there are no other rule also matching the input. Useful for cases where only one rule should match and more than one trigger may indication some unexpected behavior.
- `Collect` : Returns the output of all rules.

## Matchers

The rules can be formed by arbitrary code, or preferredly by using matchers. Here are the available matchers:

- `Rule.any()`: Matches any value. Always true.
- `Rule.in(Set<T> target)`: Matches if the value is in the set.
- `Rule.gt(T target)`: Matches if the value is greater than the given value.
- `Rule.ge(T target)`: Matches if the value is greater than or equal to the given value.
- `Rule.lt(T target)`: Matches if the value is less than the given value.
- `Rule.le(T target)`: Matches if the value is less than or equal to the given value.
- `Rule.is(T target)`: Matches if the value is equal to the given value.
- `Rule.isSet()`: Matches if the value is not null.

The especial `Rule.test` takes a predicate and returns a `Rule<T>` that matches if the predicate returns true. The produced `Rule` for each matcher
can be used to be negated with a `not()` call. For example `Rule.is("Samba").not().evaluate("Rock")` will evaluate to `true`.

## Future explorations

At the moment evaluation happens eagerly and Policies are used as a way to extract the results. Future explorations may include a lazy evaluation approach, moving the evaluation
to each policy.

The remaining Policies available for [decisions4s](https://business4s.org/decisions4s/) will be implemented.

A Lib-Entity Action Handler backed by a decision will be made available for a tight integration.


