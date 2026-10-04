const fs = require("fs");
const { DataTypes } = require("sequelize");
const JSON5 = require("json5");

const structRegex = /struct\s+([A-Za-z][A-Za-z0-9]*)\s*\{((?:\s*[A-Z]+(?:\s*\*)?\s+[A-Za-z][A-Za-z0-9]*\s*(?:=\s*[\S].*?\s*)?;)*)((?:\s*#[a-z]+\s+.*)*)\s*}\s*;/g;
const fieldRegex = /\s*([A-Z]+)(\s*\*)?\s+([A-Za-z][A-Za-z0-9]*)\s*(?:=\s*([\S].*?)\s*)?;/g;
const indexRegex = /\s*#define\s+index\s+(.*)/g;

function parse(text) {
    const result = [];
    const structs = [...text.matchAll(structRegex)];

    for (let i = 0; i < structs.length; i++) {
        const [, tableName, fieldDefs, hashDefs] = structs[i];
        const table = {
            tableName,
            fields: {},
            options: {}
        };

        const fields = [...fieldDefs.matchAll(fieldRegex)];
        let fieldsEndIndex = 0;

        for (let x = 0; x < fields.length; x++) {
            const field = fields[x];
            let [match, fieldType, fieldUnique, fieldName, fieldContent] = field;

            fieldsEndIndex = Math.max(fieldsEndIndex, field.index + match.length);

            if (!fieldContent && !fieldUnique) {
                table.fields[fieldName] = DataTypes[fieldType];
            } else {
                const options = {
                    type: DataTypes[fieldType]
                };

                if (fieldContent) {
                    fieldContent = fieldContent.trim();
                    options.defaultValue = /^[A-Z]+$/.test(fieldContent) ? DataTypes[fieldContent] : JSON5.parse(fieldContent);
                }

                if (fieldUnique) {
                    options.unique = true;
                }

                table.fields[fieldName] = options;
            }
        }
        

        const indexes = [...hashDefs.matchAll(indexRegex)];

        for (let x = 0; x < indexes.length; x++) {
            let [, indexJson] = indexes[x];

            if (!table.options.indexes) {
                table.options.indexes = [];
            }

            table.options.indexes.push(JSON5.parse(indexJson));
        }

        result.push(table);
    }

    return result;
}
function parseFile(filePath) {
    return parse(fs.readFileSync(filePath, "utf-8"));
}

module.exports = {
    parse,
    parseFile
};