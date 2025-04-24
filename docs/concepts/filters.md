# Flexible Filtering in LibEntity

LibEntity's filter system lets you define flexible, type-safe filters for your entities—independent of any database technology. You can use these filters to build queries for SQL, NoSQL, in-memory collections, REST APIs, or any other persistence mechanism.


## Why Use Filter Definitions?

- **Separation of Concerns:** Filters are plain Java objects (POJOs), decoupled from persistence details.
- **Reusability:** The same filter can be translated into SQL, MongoDB, or even in-memory Java streams.
- **Type Safety:** Compile-time checks prevent common mistakes.
- **Extensibility:** You can add custom comparators or logic easily.


## 1. Define a Filter Class (No jOOQ Required)

```java
public class UserFilter {
    public Integer age;
    public String name;
    public List<String> roles;
    public RangeFilter<Integer> ageRange;
}
```

## 2. Define a FilterDefinition

This maps filter fields to supported comparators (EQ, GT, IN, etc):

```java
import com.libentity.core.filter.FilterDefinition;
import com.libentity.core.filter.FieldFilterType;

FilterDefinition<UserFilter> definition = new FilterDefinition<>(
    "UserFilter",
    UserFilter.class,
    Map.of(
        "age", Set.of(FieldFilterType.EQ, FieldFilterType.GT, FieldFilterType.LT),
        "name", Set.of(FieldFilterType.EQ),
        "roles", Set.of(FieldFilterType.IN),
        "ageRange", Set.of(FieldFilterType.GT, FieldFilterType.LT, FieldFilterType.EQ)
    )
);
```

## 3. Use the Filter in Any Backend

You can now translate the filter to any query language. For example, to filter a Java list:

```java
public List<User> filterUsers(List<User> users, UserFilter filter, FilterDefinition<UserFilter> def) {
    return users.stream()
        .filter(user -> filter.age == null || user.getAge().equals(filter.age))
        .filter(user -> filter.name == null || user.getName().equals(filter.name))
        .filter(user -> filter.roles == null || filter.roles.contains(user.getRole()))
        // Add more conditions as needed
        .toList();
}
```

You could also implement translation to MongoDB queries, REST API parameters, etc.

---

## 4. jOOQ Example (Manual Translation)

If you want to use your filter with jOOQ, you can manually map fields:

```java
import org.jooq.Field;
import org.jooq.Condition;
import org.jooq.impl.DSL;

Field<Integer> AGE_FIELD = DSL.field("age", Integer.class);
Field<String> NAME_FIELD = DSL.field("name", String.class);

Map<String, Field<?>> fieldMapping = Map.of(
    "age", AGE_FIELD,
    "name", NAME_FIELD
);

UserFilter filter = new UserFilter();
filter.age = 30;

Condition condition = DSL.trueCondition();
if (filter.age != null) {
    condition = condition.and(AGE_FIELD.eq(filter.age));
}
if (filter.name != null) {
    condition = condition.and(NAME_FIELD.eq(filter.name));
}
// Use this condition in your jOOQ query
```

## 5. Advanced: Automatic jOOQ Integration

If you want to avoid manual mapping, use the `jooq-support` module and annotation processor. This will generate meta-classes and helper methods for you (see the [jooq-support](/integrations/jooq/) docs for details).

## 6. Virtual Fields

Sometimes you want to filter by a value that doesn't directly map to a database column, or that depends on the current user or context. These are called **virtual fields**.

A virtual field lets you expose a filter property (e.g., `submittedByMe`) that is translated into a query condition at runtime, using custom logic.

### Example: Virtual Field in a Filter

```java
public class InvoiceFilter {
    // ... other filter fields ...
    // This field is not a direct DB column
    private Boolean submittedByMe;
}
```

### How to Map Virtual Fields

You provide a custom mapper (e.g., for jOOQ) that translates the virtual field into a query condition. For example, to map `submittedByMe` to a condition on the current user's ID:

```java
public class InvoiceFilterVirtualMapperFactoryImpl implements InvoiceFilterJooqMetaVirtualMapperFactory {
    private final String userId;
    public InvoiceFilterVirtualMapperFactoryImpl(String userId) {
        this.userId = userId;
    }
    @Override
    public VirtualConditionMapper<InvoiceFilter> getSubmittedByMeMapper(List<Comparator> comparators) {
        if (comparators.contains(Comparator.EQ)) {
            return f -> INVOICE.EMPLOYEE_ID.eq(userId);
        }
        return f -> null;
    }
}
```

This lets you write filters like `{ submittedByMe: true }` and have them automatically translated into `employee_id = :userId` in your query.

### Why Virtual Fields?
- **Personalized Queries:** e.g., "only my data"
- **Derived or Computed Values:** e.g., "overdue" (due date < today)
- **Multi-table/Join Logic:** e.g., filter by a property in a related entity

### How to Use
- Define the virtual field in your filter class
- Register a custom mapper that translates the field to a query condition
- Use as normal in your filter logic—works for jOOQ, in-memory, or any backend

## Summary
- **Filters are plain Java objects**—not tied to any database.
- **FilterDefinition** describes what fields and comparators are supported.
- **You control how filters are translated**: SQL, NoSQL, REST, or in-memory.
- **jOOQ integration is optional**—you can use filters anywhere!

For more, see the examples and the [jooq-support](/integrations/jooq/) module.
