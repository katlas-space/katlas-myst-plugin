# Test Page

This is a test page to verify plugin loading.

# Sample Diagram

```mermaid
graph TD
  A[Start] --> B{Is it working?}
  B -- Yes --> C[Great!]
  B -- No --> D[Fix it]
```

# Diagram with Inline Config
```mermaid
---
config:
  theme: default
---
graph TD
  A --> B
```

(my-labeled-diagram)=
```mermaid
graph TD
    A[Label] --> B[Test]
```

# Alias Support
:::{ktl:mermaid}
graph TD
    Alias --> Support
:::

# Python Directive Support

:::{ktl:mermaid}
graph TD
    Py[Python Directive] --> Works[Yes!]
:::



