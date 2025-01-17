# Endpoints

`GET /api/health` - Health check endpoint

## WebSocket

`/api/room` - WebSocket endpoint for quiz room

| Sent by | Event            | Payload                                                  | Description                 |
| ------- | ---------------- | -------------------------------------------------------- | --------------------------- |
| Client  | `meta:setup`     | `String`                                                 | Setup a room                |
| Server  | `meta:close`     |                                                          | Close the room              |
| Server  | `meta:code`      | `String`                                                 | Get the code                |
| Client  | `meta:join`      | `String`                                                 | Join the room               |
| Server  | `meta:error`     | name:`String`,<br/>message:`String`,<br/>stack:`String?` | Error                       |
| Server  | `members:all`    | `Player[]`                                               | Get the list of players     |
| Server  | `members:join`   | `Player`                                                 | Join the room (propagated)  |
| Server  | `members:leave`  | `Player`                                                 | Leave the room (propagated) |
| Client  | `interact:emote` | `String`                                                 | Send an emote               |
| Any     | `interact:emote` | `String`                                                 | Send an emote (propagated)  |

## REST

TODO: Rest API for quiz, questions, answers, profile, etc.
