# < fetched-list >

Dependency-free component that implements **live-search** (value suggestion) to any `<input>` element via `<datalist>`

[Demo](https://fetched-list.ponomarevlad.ru)

## How to use

### 1. Load module

```html
<!-- From CDN -->
<script src="https://esm.run/fetched-list" type="module"></script>
```

### 2. Connect `<input>` element

```html
<!-- Just wrap any input -->
<fetched-list>
    <input>
</fetched-list>

<!-- Or refer to it by ID -->
<input id="inputId">
<!-- ... -->
<fetched-list value-from="inputId"></fetched-list>
```

### 3. Configure

```html
<!-- From demo/index.html -->
<fetched-list
        url="http://geodb-free-service.wirefreethought.com/v1/geo/countries?limit=10"
        param="namePrefix" check="metadata.totalCount" list-path="data" value-path="name"
        label-path="code" title-case="true" initial-fetch="true" auto-select="true">
    <input autocapitalize="words" placeholder="Type any Country" type="search">
</fetched-list>
```

## Properties

| Property        | Attribute        | Description                                                       |
|-----------------|------------------|-------------------------------------------------------------------|
| `url`           | `url`            | API endpoint for fetching options                                 |
| `param`         | `param`          | Name of query parameter where to put text from input              |
| `check`         | `check`          | Absolute JSON path to property that indicate successful response  |
| `listPath`      | `list-path`      | Absolute JSON path to property that contains array with options   |
| `valuePath`     | `value-path`     | Relative JSON path to property that contains value of each option |
| `labelPath`     | `label-path`     | Relative JSON path to property that contains label of each option |
| `titleCase`     | `title-case`     | Automatically capitalize first letter when typing                 |
| `valueFrom`     | `value-from`     | ID of outer input element to be used instead of inner input       |
| `autoSelect`    | `auto-select`    | Automatically select most relevant variant from list              |
| `initialFetch`  | `initial-fetch`  | Prefetch an options before input                                  |
| `removeOptions` | `remove-options` | Clear list of options before populating                           |
