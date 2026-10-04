# sqlz

A Node.JS library for parsing .sqlz files; a custom format for defining Sequelize schemas.

## .sqlz file usage

The language is inspired by C++:
```cpp
// A comment is allowed here
// But /* */ comments are not supported
struct User {
    STRING* email;
    STRING fullName;
    DATE birthDate;
    TINYINT level = 1;
    DATE lastOnline = NOW;

    #define index {fields: ["email"]}
};
```

Explanation:
- `*` means that the field is unique
- `= <value>` means that the field has a default value
- `NOW` and any other values that are capital and not a string are prepended with `DataTypes.`
- `#define index <json>` defines an index
- Comments are allowed above or in-between structs, but not anywhere inside the struct

The above code generates the following JSON:
```js
const { DataTypes } = require("sequelize");

[
    {
        tableName: "User",
        fields: {
            email: {
                type: DataTypes.STRING,
                unique: true
            },
            fullName: DataTypes.STRING,
            birthDate: DataTypes.DATE,
            level: {
                type: DataTypes.TINYINT,
                defaultValue: 1
            },
            lastOnline: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW
            }
        },
        options: {
            indexes: [
                {fields: ["email"]}
            ]
        }
    }
]
```

`.options.indexes` may not exist if there were no indexes defined.

## sqlz library usage

```js
const sqlz = require("sqlz");

// parse from a string
console.log(sqlz.parse("struct Test{STRING* testString='Hello world!';};"));
/*
[
    {
        tableName: "User",
        fields: {
            testString: {
                type: DataTypes.STRING,
                defaultValue: "Hello world!",
                unique: true
            }
        }
    }
]
*/

// parse from a file (synchronous)
const userDef = sqlz.parseFile("User.sqlz");
console.log(userDef);


// you can now pass it to Sequelize to register as a model
const sequelize = require("sequelize");
const User = sequelize.define(userDef.tableName, userDef.fields, userDef.options);
```
