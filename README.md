<h1 align="center">poly</h1>
<h4 align="center">An ECS library</h4>

## Guide

todo

## Replication

poly is packaged with a Replication system

- `removeRef`, if called from the server, does not automatically remove the ref on the client. It is recommended to tag your instance entities with `polyEntity` and include the built-in `EntityWatcher` system to have them automatically `removeRef` when destroyed. Otherwise, you must create your own solution.
- the `"_N"` string is reserved for use with the `Diff` ReplicationType to represent a value turned nil (so don't make any values `"_N"`).