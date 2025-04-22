# LibEntity with Spring Boot

> **Business Context:**  
> This example models a simple invoice management system for a company. Employees submit invoices, which are then validated, approved, or rejected by managers. The system supports filtering invoices (e.g., by amount, due date, or approval status) and executing actions (like approve, reject, or mark as paid) on each invoice.  
>   
> The guide below shows how to implement this workflow using libentity, jOOQ, and Spring Boot.

---

## 1. Project Setup

Add the required dependencies to your `build.gradle`:

```groovy
implementation 'com.libentity:library:<latest-version>'
implementation 'com.libentity:jooq-support:<latest-version>'
implementation 'org.springframework.boot:spring-boot-starter'
implementation 'org.jooq:jooq'
```

---

## 2. Define Your Entity

Use Lombok for boilerplate reduction and define your domain entity:

```java
@Data
public class Invoice {
    private Long id;
    private String employeeId;
    private BigDecimal vat;
    private BigDecimal amount;
    private LocalDate dueDate;
    private LocalDate submittedAt;
    private String submitterId;
    // ...other fields...
    private InvoiceState state = InvoiceState.DRAFT; // Default state
}
```

---

## 3. Define the Entity Type (Validation, Actions, State)

Configure your entity’s fields, validation, and state transitions using the EntityType builder:

```java
@Configuration
public class InvoiceEntityTypeConfig {

    @Bean
    public EntityType<InvoiceState, InvoiceRequestContext> invoiceEntityType() {
        return EntityType.<InvoiceState, InvoiceRequestContext>builder("Invoice")
            .field("amount", BigDecimal.class, f -> f
                .validateInState(InvoiceState.DRAFT, (state, request, ctx) -> {
                    if (request.invoice().getAmount() == null
                        || request.invoice().getAmount().compareTo(BigDecimal.ZERO) <= 0) {
                        ctx.addError("AMOUNT_INVALID", "Amount must be positive");
                    }
                    if (request.invoice().getAmount() != null
                        && request.invoice().getAmount().compareTo(new BigDecimal("10000")) > 0) {
                        ctx.addError("AMOUNT_TOO_LARGE", "Amount cannot exceed 10,000");
                    }
                })
                .validateStateTransition(
                    InvoiceState.DRAFT, InvoiceState.PENDING_APPROVAL,
                    (fromState, toState, request, ctx) -> {
                        if (request.invoice().getAmount() == null
                            || request.invoice().getAmount().compareTo(new BigDecimal("1000")) > 0) {
                            ctx.addError("AMOUNT_APPROVAL_LIMIT", "Amount exceeds manager approval threshold");
                        }
                    }
                )
            )
            .field("vat", BigDecimal.class, f -> f
                .validateInState(InvoiceState.DRAFT, (state, request, ctx) -> {
                    if (request.invoice().getVat() == null) {
                        ctx.addError("VAT_REQUIRED", "VAT is required");
                    }
                })
            )
            // ...define other fields, actions, and transitions...
            .build();
    }
}
```

This configuration:
- Declares fields and their types
- Adds validation logic for states and transitions
- Sets up the business rules for your workflow

---

## 4. Create a Filter Class

Annotate your filter class for jOOQ support:

```java
@Data
@JooqFilter(
    tableClass = "org.jooq.generated.tables.Invoice",
    tableVar = "INVOICE",
    defaultSort = @JooqDefaultSort(field = "dueDate", direction = SortDirection.DESC)
)
public class InvoiceFilter {
    @JooqFilterField(field = "AMOUNT", comparators = {Comparator.GT, Comparator.LT, Comparator.EQ})
    private RangeFilter<BigDecimal> amount;

    @JooqFilterField(field = "READY_FOR_APPROVAL", comparators = {Comparator.BOOLEAN})
    private Boolean readyForApproval;

    @JooqFilterField(field = "EMPLOYEE_ID", comparators = {Comparator.IN})
    private Set<String> employeeIdIn;

    // ...other filter fields...
}
```

The annotation processor will generate meta-classes for you, reducing boilerplate.

---

## 5. Repository Layer

Your repository can use the generated filter meta and jOOQ to build dynamic queries:

```java
@Repository
public class InvoiceRepository {
    @Autowired
    private DSLContext dsl;

    public List<Invoice> findByFilter(InvoiceFilter filter) {
        Condition condition = JooqFilterSupport.buildCondition(
            filter,
            InvoiceFilterJooqMeta.DEFINITION,
            InvoiceFilterJooqMeta.FIELD_MAPPING
        );
        return dsl.selectFrom(INVOICE)
                  .where(condition)
                  .fetchInto(Invoice.class);
    }

    public Invoice loadById(Long id) {
        return dsl.selectFrom(INVOICE)
                  .where(INVOICE.ID.eq(id))
                  .fetchOneInto(Invoice.class);
    }
}
```

---

## 6. Service Layer

Wire up your business logic, including action execution and filter queries:

```java
@Service
@RequiredArgsConstructor
public class InvoiceService {
    private final ActionExecutor<InvoiceState, InvoiceRequestContext> actionExecutor;
    private final InvoiceRepository invoiceRepository;

    public InvoiceWithRateResponse handleAction(String invoiceId, ActionCommand command) {
        Invoice invoice = invoiceRepository.loadById(Long.valueOf(invoiceId));
        ValidationContext ctx = new ValidationContext();

        ActionResult<InvoiceState, InvoiceRequestContext, ActionCommand> result =
            actionExecutor.execute(invoice.getState(), new InvoiceRequestContext(invoice), ctx, command);

        InvoiceWithRateResponse response = new InvoiceWithRateResponse();
        response.setInvoice(result.request().invoice());
        response.setAllowedActions(actionExecutor.getAllowedActions(result.state(), result.request()));
        return response;
    }

    public List<InvoiceWithRateResponse> findByFilter(InvoiceFilter filter) {
        return invoiceRepository.findByFilter(filter).stream()
            .map(invoice -> {
                InvoiceWithRateResponse response = new InvoiceWithRateResponse();
                response.setInvoice(invoice);
                response.setAllowedActions(
                    actionExecutor.getAllowedActions(invoice.getState(), new InvoiceRequestContext(invoice)));
                return response;
            })
            .collect(Collectors.toList());
    }
}
```

---

## 7. REST Controller

Expose your actions and filter queries via a Spring REST controller:

```java
@RestController
@RequestMapping("/invoice/action")
@RequiredArgsConstructor
public class InvoiceActionController {
    private final InvoiceService invoiceService;

    @PostMapping
    public ResponseEntity<InvoiceWithRateResponse> handleInvoiceAction(
            @RequestParam("invoiceId") String invoiceId, @RequestBody InvoiceActionCommand command) {
        InvoiceWithRateResponse response = invoiceService.handleAction(invoiceId, command);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/filter")
    public ResponseEntity<List<InvoiceWithRateResponse>> filterInvoices(@RequestBody InvoiceFilter filter) {
        List<InvoiceWithRateResponse> invoices = invoiceService.findByFilter(filter);
        return ResponseEntity.ok(invoices);
    }
}
```

---

## 8. Example: Filtering Invoices

To filter invoices, POST to `/invoice/action/filter` with a JSON body like:

```json
{
  "amount": { "gte": 100, "lte": 500 },
  "readyForApproval": true,
  "employeeIdIn": ["emp1", "emp2"]
}
```

The response will be a list of invoices matching your criteria.

---

## 9. Example: Executing Actions

To execute an action (like approve, reject, etc.), POST to `/invoice/action` with:

```json
{
  "invoiceId": "123",
  "command": {
    "type": "APPROVE",
    "comment": "Looks good!"
  }
}
```

---

## Summary

- **Define your entities and filters with annotations**
- **Configure your entity type for validation, actions, and state transitions**
- **Let the annotation processor generate meta-classes**
- **Use the service and repository layers to wire up business logic**
- **Expose everything via REST endpoints**
- **Enjoy type-safe, dynamic filtering and action execution!**

For more, see the [`examples/spring-example`](https://github.com/paulosuzart/lib-entity/tree/main/examples/spring-example) folder in this repository.
