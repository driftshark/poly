<h1 align="center">poly</h1>
<h4 align="center">An ECS library</h4>

## Guide

register components in before systems

## Replication

poly is packaged with a Replication system

- destroying `ReplicationSubscription` does not automatically destroy all replicated components on the ref's client. This is because this is rarely done, and only done when a player is leaving (in which case this is unnecessary), or something like the player going into another `World`. In that case, the developer should create their own solution to cleaning up replicated components, which in the previous example, would probably be to just destroy the old world on the player's client, with there being no need to send a list of components (and their refs) to remove.
- `removeRef`, if called from the server, does not automatically remove the ref on the client. It is recommended to tag your instance entities with `polyEntity` and include the built-in `EntityWatcher` system to have them automatically `removeRef` when destroyed. Otherwise, you must create your own solution.
- the `"_N"` string is reserved for use with the `Diff` ReplicationType and components with selective replication on keys of data to represent a value turned nil (so don't make any values `"_N"`).
