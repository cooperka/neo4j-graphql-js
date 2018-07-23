'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.addOrderByToSchema = exports.addIdFieldToSchema = undefined;

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

var _from = require('babel-runtime/core-js/array/from');

var _from2 = _interopRequireDefault(_from);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

exports.addMutationsToSchema = addMutationsToSchema;

var _graphqlTools = require('graphql-tools');

var _index = require('./index');

var _graphql = require('graphql');

var _utils = require('./utils');

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function addMutationsToSchema(schema) {
  var types = typesToAugment(schema);

  // FIXME: don't use printSchema (custom directives are lost), instead use extend schema
  // FIXME: type extensions are lost
  var mutationSchemaSDL = (0, _graphql.printSchema)(schema);

  // TODO: compose augment funcs
  //let mutationSchemaSDLWithTypes = augmentTypes(types, schema, mutationSchemaSDL);

  var mutationSchemaSDLWithTypesAndMutations = augmentMutations(
    types,
    schema,
    mutationSchemaSDL
  );
  //console.log(mutationSchemaSDLWithTypesAndMutations);

  var resolvers = types.reduce(
    function(acc, t) {
      // FIXME: inspect actual mutations, not construct mutation names here
      acc.Mutation['Create' + t] = _index.neo4jgraphql;
      types.forEach(function(t) {
        addRelationshipMutations(schema.getTypeMap()[t], true).forEach(function(
          m
        ) {
          acc.Mutation[m] = _index.neo4jgraphql;
        });
      });

      return acc;
    },
    { Mutation: {}, Query: {} }
  );

  // delegate query resolvers to original schema
  resolvers = (0, _keys2.default)(schema.getQueryType().getFields()).reduce(
    function(acc, t) {
      acc.Query[t] = function(obj, args, context, info) {
        return info.mergeInfo.delegateToSchema({
          schema: schema,
          operation: 'query',
          fieldName: t,
          args: args,
          context: context,
          info: info
        });
      };
      return acc;
    },
    resolvers
  );

  var mutationSchema = (0, _graphqlTools.makeExecutableSchema)({
    typeDefs: mutationSchemaSDLWithTypesAndMutations,
    resolvers: resolvers
  });

  var onTypeConflict = function onTypeConflict(left, right, info) {
    // FIXME: throws away type extensions
    // FIXME: use schema transform for type augmentation
    return left;
  };

  // TODO: ensure onTypeConflict is handled correctly
  // see: https://www.apollographql.com/docs/graphql-tools/schema-stitching.html#mergeSchemas
  var finalSchema = (0, _graphqlTools.mergeSchemas)({
    schemas: [schema, mutationSchema],
    resolvers: resolvers,
    onTypeConflict: onTypeConflict
  });

  return finalSchema;
}

var addIdFieldToSchema = (exports.addIdFieldToSchema = function addIdFieldToSchema(
  schema
) {
  var types = typesToAugment(schema);

  var idSchemaTypeDefs = '\n  type Node {\n    _id: ID\n  }\n  ';

  var idSchema = (0, _graphql.buildSchema)(idSchemaTypeDefs);

  var idField = idSchema._typeMap.Node._fields._id;

  types.forEach(function(t) {
    schema._typeMap[t]._fields['_id'] = idField;
  });

  return schema;
});

var addOrderByFields = function addOrderByFields(schema) {
  throw new Error('addOrderByFields is not yet implemented');

  // FIXME: this approach seems to create duplicate arg fields somehow and fails schema validation
  var types = arrayQueryFieldsAndTypes(schema);

  types.forEach(function(_ref) {
    var field = _ref.field,
      type = _ref.type;

    var orderByArg = {
      astNode: undefined,
      defaultValue: undefined,
      description: '',
      name: 'orderBy',
      type: schema._typeMap['_' + type + 'Ordering']
    };

    schema._queryType._fields[field].args.push(orderByArg);
    schema._typeMap.Query._fields[field].args.push(orderByArg);
  });
};

var addOrderByEnumTypes = function addOrderByEnumTypes(schema) {
  // FIXME: initially this will only work on query types

  // for each query type return type (that returns an array)
  // add `field`_asc and `field`_desc

  var types = arrayQueryTypes(schema);

  var enumTypeSDL = types.reduce(function(acc, t) {
    return (
      acc +
      ('\n      enum _' +
        t +
        'Ordering {\n        ' +
        (0, _keys2.default)(schema.getTypeMap()[t]._fields).reduce(function(
          fieldStr,
          k
        ) {
          return (
            fieldStr +
            ('\n            ' +
              k +
              '_asc,\n            ' +
              k +
              '_desc,\n          ')
          );
        },
        '') +
        '\n      }\n    ')
    );
  }, '');

  var enumSchema = (0, _graphql.buildSchema)(enumTypeSDL);

  var mergedSchema = (0, _graphqlTools.mergeSchemas)({
    schemas: [schema, enumSchema]
  });

  return mergedSchema;
};

var arrayQueryFieldsAndTypes = function arrayQueryFieldsAndTypes(schema) {
  // [{field: "MoviesByYear", type: "Movie"}]

  var queryTypeNames = (0, _keys2.default)(schema._queryType._fields).filter(
    function(f) {
      return (
        schema._queryType._fields[f].type.constructor === _graphql.GraphQLList
      );
    }
  );

  return queryTypeNames.map(function(t) {
    return {
      field: t,
      type: innerType(schema._queryType._fields[t].type).name
    };
  });
};

var arrayQueryTypes = function arrayQueryTypes(schema) {
  // return the type names for all query types returned as an array

  var queryTypeNames = (0, _keys2.default)(schema._queryType._fields).filter(
    function(f) {
      return (
        schema._queryType._fields[f].type.constructor === _graphql.GraphQLList
      );
    }
  );

  var queryTypes = queryTypeNames.map(function(f) {
    return innerType(schema._queryType._fields[f].type).name;
  });

  return (0, _from2.default)(new _set2.default(queryTypes));
};

/**
 * Given a GraphQLSchema return a new schema where orderBy
 * field has been added to each type as well as corresponding
 * enums for specifying order
 * @param {*} schema
 */
var addOrderByToSchema = (exports.addOrderByToSchema = function addOrderByToSchema(
  schema
) {
  schema = addOrderByEnumTypes(schema);
  schema = addOrderByFields(schema);

  return schema;
});

/**
 * Given a GraphQLSchema return an array of the type names,
 * excluding Query and Mutation types
 * @param {GraphQLSchema} schema
 * @returns {string[]}
 */
function typesToAugment(schema) {
  // TODO: check for @ignore and @model directives
  return (0, _keys2.default)(schema.getTypeMap()).filter(function(t) {
    return schema.getTypeMap()[t].astNode === undefined
      ? false
      : schema.getTypeMap()[t].astNode.kind === 'ObjectTypeDefinition' &&
          t !== 'Query' &&
          t !== 'Mutation';
  });
}

/**
 * Generate type extensions for each type:
 *   - add _id field
 * @param {string[]} types
 * @param schema
 * @param {string} sdl
 * @returns {string} SDL type extensions
 */
function augmentTypes(types, schema, sdl) {
  return types.reduce(function(acc, t) {
    if (t === 'Mutation' || t === 'Query') {
      return acc + '';
    } else {
      return (
        acc +
        ('\n    \n    extend type ' + t + ' {\n      _id: ID\n    }\n    ')
      );
    }
  }, sdl);
}

function augmentMutations(types, schema, sdl) {
  // FIXME: requires placeholder Query type?
  return (
    sdl +
    ('\n    extend schema {\n      mutation: Mutation\n    }\n\n  \n    type Mutation {\n  \n    ' +
      types.reduce(function(acc, t) {
        return (
          acc +
          ('\n      ' +
            createMutation(schema.getTypeMap()[t]) +
            '\n      ' +
            addRelationshipMutations(schema.getTypeMap()[t]) +
            ' \n    ')
        );
      }, '') +
      '\n\n  }')
  );
}

function createMutation(type) {
  return 'Create' + type.name + '(' + paramSignature(type) + '): ' + type.name;
}

function addRelationshipMutations(type) {
  var namesOnly =
    arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

  var mutations = '';
  var mutationNames = [];

  var relationshipFields = (0, _keys2.default)(type.getFields()).filter(
    function(x) {
      for (var i = 0; i < type.getFields()[x].astNode.directives.length; i++) {
        if (
          type.getFields()[x].astNode.directives[i].name.value === 'relation'
        ) {
          return true;
        }
      }
    }
  );

  relationshipFields.forEach(function(x) {
    var relationDirective = type
      .getFields()
      [x].astNode.directives.filter(function(d) {
        return d.name.value === 'relation';
      })[0];

    var relTypeArg = void 0,
      directionArg = void 0,
      fromType = void 0,
      toType = void 0;

    try {
      relTypeArg = relationDirective.arguments.filter(function(a) {
        return a.name.value === 'name';
      })[0];
    } catch (e) {
      throw new Error('No name argument specified on @relation directive');
    }

    try {
      directionArg = relationDirective.arguments.filter(function(a) {
        return a.name.value === 'direction';
      })[0];
    } catch (e) {
      // FIXME: should we ignore this error to define default behavior?
      throw new Error('No direction argument specified on @relation directive');
    }

    if (
      directionArg.value.value === 'OUT' ||
      directionArg.value.value === 'out'
    ) {
      fromType = type;
      toType = innerType(type.getFields()[x].type);
    } else {
      fromType = innerType(type.getFields()[x].type);
      toType = type;
      return; // don't create duplicate definition of mutation (only for one direction)
    }

    var fromPk = primaryKey(fromType);
    var toPk = primaryKey(toType);

    // FIXME: could add relationship properties here
    mutations +=
      '\n    Add' +
      fromType.name +
      toType.name +
      '(' +
      (0, _utils.lowFirstLetter)(fromType.name + fromPk.name) +
      ': ' +
      innerType(fromPk.type).name +
      '!, ' +
      (0, _utils.lowFirstLetter)(toType.name + toPk.name) +
      ': ' +
      innerType(toPk.type).name +
      '!): ' +
      fromType.name +
      ' @MutationMeta(relationship: "' +
      relTypeArg.value.value +
      '", from: "' +
      fromType.name +
      '", to: "' +
      toType.name +
      '")\n    ';

    mutationNames.push('Add' + fromType.name + toType.name);
  });

  if (namesOnly) {
    return mutationNames;
  } else {
    return mutations;
  }
}

/**
 * Returns the field to be treated as the "primary key" for this type
 * Primary key is determined as the first of:
 *   - non-null ID field
 *   - ID field
 *   - first String field
 *   - first field
 *
 * @param {ObjectTypeDefinition} type
 * @returns {FieldDefinition} primary key field
 */
function primaryKey(type) {
  // Find the primary key for the type
  // first field with a required ID
  // if no required ID type then first required type

  var pk = firstNonNullAndIdField(type);
  if (!pk) {
    pk = firstIdField(type);
  }

  if (!pk) {
    pk = firstNonNullField(type);
  }

  if (!pk) {
    pk = firstField(type);
  }
  return pk;
}

function paramSignature(type) {
  return (0, _keys2.default)(type.getFields()).reduce(function(acc, f) {
    if (
      f === '_id' ||
      (innerType(type.getFields()[f].type).astNode &&
        innerType(type.getFields()[f].type).astNode.kind ===
          'ObjectTypeDefinition')
    ) {
      // TODO: exclude @cypher fields
      // TODO: exclude object types?
      return acc + '';
    } else {
      return (
        acc + (' ' + f + ': ' + innerType(type.getFields()[f].type).name + ',')
      );
    }
  }, '');
}

function innerType(type) {
  return type.ofType ? innerType(type.ofType) : type;
}

function firstNonNullAndIdField(type) {
  var fields = (0, _keys2.default)(type.getFields()).filter(function(t) {
    return (
      t !== '_id' &&
      type.getFields()[t].type.constructor.name === 'GraphQLNonNull' &&
      innerType(type.getFields()[t].type.name === 'ID')
    );
  });

  if (fields.length === 0) {
    return undefined;
  } else {
    return type.getFields()[fields[0]];
  }
}

function firstIdField(type) {
  var fields = (0, _keys2.default)(type.getFields()).filter(function(t) {
    return t !== '_id' && innerType(type.getFields()[t].type.name === 'ID');
  });

  if (fields.length === 0) {
    return undefined;
  } else {
    return type.getFields()[fields[0]];
  }
}

function firstNonNullField(type) {
  var fields = (0, _keys2.default)(type.getFields()).filter(function(t) {
    return (
      (t !== type.getFields()[t].type.constructor.name) === 'GraphQLNonNull'
    );
  });

  if (fields.length === 0) {
    return undefined;
  } else {
    return type.getFields()[fields[0]];
  }
}

function firstField(type) {
  var fields = (0, _keys2.default)(type.getFields()).filter(function(t) {
    return t !== '_id';
  });
  return type.getFields()[fields[0]];
}
