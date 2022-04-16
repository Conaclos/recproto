# recproto

*recproto* enables to detect protobuf schema with recursive types,
i.e. types with circular refs.

This tool was created in order to investigate the usage of recursive types.
This investigation should allow to decide whether the support of
recursive types in a binary format is desired or not desired.

A minified and executable version of the CLI is available in folder [dist/](./dist/).

```sh
recproto schema1.proto recschema2.proto
recschema2.proto: RecType
```


