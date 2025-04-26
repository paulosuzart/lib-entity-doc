# Instance Factories for Actions and Validators

By default, the annotation processor creates new handler and validator instances using reflection. For advanced scenarios, such as integration with Spring or custom DI frameworks, you can supply a custom instance factory:

```java
EntityAnnotationProcessor processor = new EntityAnnotationProcessor(clazz -> applicationContext.getBean(clazz));
```

Or for manual/test-scoped instances:
```java
MyHandler handler = new MyHandler();
var processor = new EntityAnnotationProcessor(clazz -> {
    if (clazz.equals(MyHandler.class)) return handler;
    return clazz.getDeclaredConstructor().newInstance();
});
```

This allows seamless integration with dependency injection frameworks or test doubles, making your annotated actions and validators highly flexible and testable.

## Using with Spring

If you are using Spring, you can easily wire the annotation processor to use Spring's `ApplicationContext` for instance creation:

```java
@Configuration
public class EntityConfig {
    @Autowired
    private ApplicationContext applicationContext;

    @Bean
    public EntityAnnotationProcessor entityAnnotationProcessor() {
        return new EntityAnnotationProcessor(applicationContext::getBean);
    }
}
```

This ensures that all your annotated handlers and validators are managed as Spring beans, enabling full dependency injection and lifecycle management.

--
*Note: In future version of LibEntity, a dedicated `annotation-support-spring` module may be provided for even smoother integration.*
