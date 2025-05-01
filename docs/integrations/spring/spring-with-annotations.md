# LibEntity annotations with Spring Boot

It is also possible to use the annotation-based DSL with Spring Boot. 

## Define the `EntityTypeRegistry` bean

```java
@Bean
@Qualifier("entityTypeRegistryPayment")
public EntityTypeRegistry entityTypeRegistry() {
    EntityAnnotationProcessor processor = new EntityAnnotationProcessor();
    return processor.buildEntityTypes("com.libentity.example.model");
}
```

The `EntityTypeRegistry` bean is used to resolve entity types and actions. It stores the entities that were scanned by the EntityAnnotationProcessor.

## Define the `EntityType` bean

With the EntityRegistry at hand, you can fetch your entity type:

```java
@Bean
@Qualifier("paymentEntityType")
public EntityType<PaymentState, PaymentRequestContext> paymentEntityType(
        @Qualifier("entityTypeRegistryPayment") EntityTypeRegistry registry) {
    return (EntityType<PaymentState, PaymentRequestContext>)
            registry.entityTypes().get("Payment");
}
```
## Define the `ActionExecutor` bean

```java
@Bean
public ActionExecutor<PaymentState, PaymentRequestContext> paymentActionExecutor(
        @Qualifier("paymentEntityType") EntityType<PaymentState, PaymentRequestContext> paymentEntityType,
        @Qualifier("entityTypeRegistryPayment") EntityTypeRegistry registry) {
    return SyncActionExecutor.<PaymentState, PaymentRequestContext>builder()
            .entityType(paymentEntityType)
            // Important. See note below
            .commandToActionResolver(registry.getCommandToActionNameResolver())
            .build();
}

```

::: warning Important
The ActionExecutor needs to know how to resolve the action name from the command. This is done by the `commandToActionResolver`, which is already provided by the `EntityTypeRegistry`.

By default, the `SyncActionExecutor` will use a `CommandToActionNameResolver` that will resolve the action name from the command `getActionName()` method.
:::

## Use in your application

With EntityTypes and Action Executors defined it's possible to use them in your service layer:

```java
@Component
@RequiredArgsConstructor

public class PaymentService {
    private final ActionExecutor<PaymentState, PaymentRequestContext> actionExecutor;
    private final ModelMapper modelMapper;

    public PaymentAggregate approvePayment(ApprovePaymentCommand command) {
        // complete fake payment to approve
        PaymentAggregate paymentAgg = new PaymentAggregate();
        paymentAgg.setId(UUID.randomUUID());
        // ...
    }
}
```

::: info
In the future auto configuration will be provided for Spring Boot.
:::