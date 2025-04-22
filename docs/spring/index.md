# LibEntity with Spring Boot

This guide walks you through integrating libentity into a Spring Boot application, including entity and filter definition, service wiring, action execution, and filter-based queries. Example code is based on the real [`examples/spring-example`](https://github.com/paulosuzart/lib-entity/tree/main/examples/spring-example) in this repository.

---

## 1. Project Setup

Add the required dependencies to your `build.gradle`:

```groovy
implementation 'com.libentity:library:<latest-version>'
implementation 'com.libentity:jooq-support:<latest-version>'
implementation 'org.springframework.boot:spring-boot-starter'
implementation 'org.jooq:jooq'
```

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

## 3. Create a Filter Class

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

## 4. Repository Layer
Your repository can use the generated filter meta and jOOQ to build dynamic queries:

```java
@Repository
public class InvoiceRepository {
    // Inject DSLContext (jOOQ)
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

## 5. Service Layer
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

## 6. REST Controller

Expose your actions and filter queries via a Spring REST controller:

```java
CopyInsert
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
}```

## 7. Example: Filtering Invoices

To filter invoices, POST to /invoice/action/filter with a JSON body like:

```json
{
  "amount": { "gte": 100, "lte": 500 },
  "readyForApproval": true,
  "employeeIdIn": ["emp1", "emp2"]
}
```
The response will be a list of invoices matching your criteria.

## 8. Example: Executing Actions
To execute an action (like approve, reject, etc.), POST to /invoice/action with: