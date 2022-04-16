#!/usr/bin/node

//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under MIT license (https://mit-license.org/)

import * as fs from "node:fs"
import proto from "protobufjs"

main(process.argv.slice(2))

/**
 * Print schema with recursive type·s and the first type detected as recursive.
 * @param {readonly string[]} filepaths
 */
function main(filepaths) {
    if (filepaths.length === 0) {
        console.error("at least one file path must be provided")
        process.exit(1)
    }
    for (const filepath of filepaths) {
        try {
            const data = proto.parse(fs.readFileSync(filepath))
            try {
                checkRecursive(data.root, new Map(), new Set())
            } catch (e) {
                console.info(`${filepath}: ${e.message}`)
            }
        } catch (e) {
            console.error(`${filepath}: parsing error: ${e.message}`)
        }
    }
}

/**
 * @param {proto.ReflectionObject} nested
 * @param {ReadOnlyMap<string, proto.Type>} symbols
 * @param {ReadOnlySet<ReflectionObject>} traversed
 * @throws {Error} upon detection of a recursive type
 */
function checkRecursive(type, symbols, traversed) {
    if (type.nested) {
        const addedSymbols = new Map(symbols)
        addScopedSymbols(type.nested, addedSymbols)
        symbols = addedSymbols
        for (const subtype of Object.values(type.nested)) {
            checkRecursive(subtype, symbols, traversed)
        }
    }
    if (type instanceof proto.Type) {
        for (const field of Object.values(type.fields)) {
            const resolvedFieldType = symbols.get(field.type)
            if (resolvedFieldType) {
                if (traversed.has(resolvedFieldType)) {
                    throw Error(`${field.type}`)
                } else {
                    const subTraversed = new Set(traversed)
                    subTraversed.add(resolvedFieldType)
                    checkRecursive(resolvedFieldType, symbols, subTraversed)
                }
            }
        }
    }
}

/**
 * Add relevant symbols of scope in symbols.
 * This may shadow previous names.
 * Consider to clone your symbol map before calling this procedure on that.
 *
 * @param {Record<string, proto.ReflectionObject>} scope scope to analyze
 * @param {Map<string, proto.ReflectionObject>} symbols where to add new symbols
 */
function addScopedSymbols(scope, symbols) {
    for (const [key, type] of Object.entries(scope)) {
        if (
            type instanceof proto.Type ||
            type instanceof proto.Enum ||
            type instanceof proto.OneOf
        ) {
            symbols.set(key, type)
        }
    }
}
