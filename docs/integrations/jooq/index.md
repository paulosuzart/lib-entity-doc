# LibEntity Filters with jOOQ

**jooq-support** is a utility module for integrating LibEntity filter definitions with [jOOQ](https://www.jooq.org/) in Java projects. It provides a bridge between high-level, type-safe filter objects and the construction of dynamic, composable SQL `Condition` objects for use in jOOQ queries. This makes filtering, searching, and querying your database seamless, robust, and maintainable.

## Features

- **Automatic translation of LibEntity filter objects to jOOQ `Condition` objects**
- **Support for a wide range of comparators:**  
  Equality (`EQ`), greater/less than (`GT`, `GTE`, `LT`, `LTE`), `IN`, `LIKE`, and boolean
- **Range filtering** via `RangeFilter<T>`
- **Virtual fields** via custom mappers
- **Annotation processor** for generating filter meta-classes
- **Extensible:** Easily add support for new comparators or custom filter logic

---

## Getting Started

### Add Dependency

Add `jooq-support` as a dependency in your Gradle or Maven build:

```groovy
dependencies {
    implementation project(':jooq-support')
}
```

### 🚀 Annotation Processor (Recommended)
The easiest and safest way to use filters with jOOQ is via the provided annotation processor. This generates meta-classes for your filters, reducing boilerplate and ensuring correctness.

### Annotate Your Filter Class
```java
import com.libentity.jooqsupport.annotation.JooqFilter;
import com.libentity.jooqsupport.annotation.JooqFilterField;

@JooqFilter(tableClass = "UserTable", tableVar = "USER")
public class UserFilter {
    @JooqFilterField(field = "id", comparators = {Comparator.EQ})
    public Long id;
    @JooqFilterField(field = "name", comparators = {Comparator.EQ, Comparator.LIKE})
    public String name;
}
```

### Use the Generated Meta-Class

The annotation processor will generate UserFilterJooqMeta for you. Use it like this:

```java
import static com.example.UserFilterJooqMeta.*;

UserFilter filter = new UserFilter();
filter.name = "Alice";
Condition condition = JooqFilterSupport.buildCondition(filter, DEFINITION, FIELD_MAPPING);
```

::: info
The method `JooqFilterSupport.buildCondition` is used to build a jOOQ `Condition` from a filter object as a `AND` statement. In the future, it will support `OR` statements.
:::

`DEFINITION` and `FIELD_MAPPING` are generated constants mapping your filter fields to supported comparators and jOOQ fields.

### Compile-Time Safety
If you misuse the annotation (e.g., omit required attributes), compilation will fail with a clear error.

Manual Setup (Advanced/Legacy)
If you wish to define everything manually: