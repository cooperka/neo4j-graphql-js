'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.addTemporalTypes = exports.possiblyAddArgument = exports.augmentResolvers = exports.augmentTypeMap = undefined;

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _values = require('babel-runtime/core-js/object/values');

var _values2 = _interopRequireDefault(_values);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _index = require('./index');

var _graphql = require('graphql');

var _utils = require('./utils');

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

var augmentTypeMap = (exports.augmentTypeMap = function augmentTypeMap(
  typeMap,
  config
) {
  var types = (0, _keys2.default)(typeMap);
  // For now, the Query and Mutation type names have been
  // elevated from various use cases to be set here
  var queryType = 'Query';
  var mutationType = 'Mutation';
  typeMap = initializeOperationTypes({
    types: types,
    typeMap: typeMap,
    config: config,
    queryType: queryType,
    mutationType: mutationType
  });
  // adds relation directives on relation types
  // if not written, with default args
  typeMap = computeRelationTypeDirectiveDefaults(typeMap);
  typeMap = addTemporalTypes(typeMap, config);

  var queryMap = (0, _utils.createOperationMap)(typeMap.Query);
  var mutationMap = (0, _utils.createOperationMap)(typeMap.Mutation);
  var astNode = {};
  var typeName = '';
  (0, _keys2.default)(typeMap).forEach(function(t) {
    astNode = typeMap[t];
    typeName = astNode.name.value;
    if (!(0, _utils.isTemporalType)(typeName)) {
      astNode = augmentType(astNode, typeMap, config, queryType);
      // Query API Only
      // config is used in augmentQueryArguments to prevent adding node list args
      if (
        shouldAugmentType({
          config: config,
          operationType: queryType,
          type: typeName
        })
      ) {
        typeMap = possiblyAddQuery(astNode, typeMap, queryMap);
        typeMap = possiblyAddOrderingEnum(astNode, typeMap);
      }
      // Mutation API Only
      // adds node selection input types for each type
      if (
        shouldAugmentType({
          config: config,
          operationType: mutationType,
          type: typeName
        })
      ) {
        typeMap = possiblyAddTypeInput({
          astNode: astNode,
          typeMap: typeMap,
          mutationType: mutationType,
          config: config
        });
        typeMap = possiblyAddTypeMutations({
          astNode: astNode,
          typeMap: typeMap,
          mutationMap: mutationMap,
          config: config,
          mutationType: mutationType,
          typeName: typeName
        });
      }
      // Relation Type SDL support and Relation Mutation API
      typeMap = handleRelationFields({
        astNode: astNode,
        typeMap: typeMap,
        mutationMap: mutationMap,
        config: config,
        queryType: queryType,
        mutationType: mutationType
      });
      typeMap[t] = astNode;
    }
  });
  typeMap = augmentQueryArguments(typeMap, config, queryType);
  // add directive declarations for graphql@14 support
  typeMap = (0, _utils.addDirectiveDeclarations)(typeMap);
  return typeMap;
});

var augmentType = function augmentType(astNode, typeMap, config, queryType) {
  if ((0, _utils.isNodeType)(astNode)) {
    astNode.fields = addOrReplaceNodeIdField(astNode);
    astNode.fields = possiblyAddTypeFieldArguments(
      astNode,
      typeMap,
      config,
      queryType
    );
  }
  return astNode;
};

var augmentQueryArguments = function augmentQueryArguments(
  typeMap,
  config,
  queryType
) {
  // adds first / offset / orderBy to queries returning node type lists
  var queryMap = (0, _utils.createOperationMap)(typeMap.Query);
  var args = [];
  var valueTypeName = '';
  var valueType = {};
  var field = {};
  var queryNames = (0, _keys2.default)(queryMap);
  if (queryNames.length > 0) {
    queryNames.forEach(function(t) {
      field = queryMap[t];
      valueTypeName = (0, _utils.getNamedType)(field).name.value;
      valueType = typeMap[valueTypeName];
      if (
        (0, _utils.isNodeType)(valueType) &&
        (0, _utils.isListType)(field) &&
        shouldAugmentType({
          config: config,
          operationType: queryType,
          type: valueTypeName
        })
      ) {
        // does not add arguments if the field value type is excluded
        args = field.arguments;
        queryMap[t].arguments = possiblyAddArgument(args, 'first', 'Int');
        queryMap[t].arguments = possiblyAddArgument(args, 'offset', 'Int');
        queryMap[t].arguments = possiblyAddArgument(
          args,
          'orderBy',
          '_' + valueTypeName + 'Ordering'
        );
      }
    });
    typeMap.Query.fields = (0, _values2.default)(queryMap);
  }
  return typeMap;
};

var augmentResolvers = (exports.augmentResolvers = function augmentResolvers(
  augmentedTypeMap,
  resolvers
) {
  var queryResolvers = resolvers && resolvers.Query ? resolvers.Query : {};
  var generatedQueryMap = (0, _utils.createOperationMap)(
    augmentedTypeMap.Query
  );
  queryResolvers = possiblyAddResolvers(generatedQueryMap, queryResolvers);
  if ((0, _keys2.default)(queryResolvers).length > 0) {
    resolvers.Query = queryResolvers;
  }
  var mutationResolvers =
    resolvers && resolvers.Mutation ? resolvers.Mutation : {};
  var generatedMutationMap = (0, _utils.createOperationMap)(
    augmentedTypeMap.Mutation
  );
  mutationResolvers = possiblyAddResolvers(
    generatedMutationMap,
    mutationResolvers
  );
  if ((0, _keys2.default)(mutationResolvers).length > 0) {
    resolvers.Mutation = mutationResolvers;
  }
  // must implement __resolveInfo for every Interface type
  // we use "FRAGMENT_TYPE" key to identify the Interface implementation
  // type at runtime, so grab this value
  var interfaceTypes = (0, _keys2.default)(augmentedTypeMap).filter(function(
    e
  ) {
    return augmentedTypeMap[e].kind === 'InterfaceTypeDefinition';
  });
  interfaceTypes.map(function(e) {
    resolvers[e] = {};

    resolvers[e]['__resolveType'] = function(obj, context, info) {
      return obj['FRAGMENT_TYPE'];
    };
  });

  return resolvers;
});

var possiblyAddArgument = (exports.possiblyAddArgument = function possiblyAddArgument(
  args,
  fieldName,
  fieldType
) {
  var fieldIndex = args.findIndex(function(e) {
    return e.name.value === fieldName;
  });
  if (fieldIndex === -1) {
    args.push({
      kind: 'InputValueDefinition',
      name: {
        kind: 'Name',
        value: fieldName
      },
      type: {
        kind: 'NamedType',
        name: {
          kind: 'Name',
          value: fieldType
        }
      },
      directives: []
    });
  }
  return args;
});

var possiblyAddResolvers = function possiblyAddResolvers(
  operationTypeMap,
  resolvers
) {
  var operationName = '';
  return (0, _keys2.default)(operationTypeMap).reduce(function(acc, t) {
    // if no resolver provided for this operation type field
    operationName = operationTypeMap[t].name.value;
    if (acc[operationName] === undefined) {
      acc[operationName] = _index.neo4jgraphql;
    }
    return acc;
  }, resolvers);
};

var possiblyAddTypeInput = function possiblyAddTypeInput(_ref) {
  var astNode = _ref.astNode,
    typeMap = _ref.typeMap,
    mutationType = _ref.mutationType,
    config = _ref.config;

  var inputName = '_' + astNode.name.value + 'Input';
  if ((0, _utils.isNodeType)(astNode)) {
    if (typeMap[inputName] === undefined) {
      var pk = (0, _utils.getPrimaryKey)(astNode);
      if (pk) {
        var nodeInputType =
          '\n          input ' +
          inputName +
          ' { ' +
          pk.name.value +
          ': ' +
          // Always exactly require the pk of a node type
          decideFieldType((0, _utils.getNamedType)(pk).name.value) +
          '! }';
        typeMap[inputName] = (0, _graphql.parse)(nodeInputType);
      }
    }
  } else if ((0, _utils.getTypeDirective)(astNode, 'relation')) {
    // Only used for the .data argument in generated relation creation mutations
    if (typeMap[inputName] === undefined) {
      var fieldName = '';
      var valueType = {};
      var valueTypeName = '';
      var isRequired = false;
      var fields = astNode.fields;
      // The .data arg on add relation mutations,
      // which is the only arg in the API that uses
      // relation input types, is only generate if there
      // is at least one non-directed field (property field)
      var hasSomePropertyField = fields.find(function(e) {
        return e.name.value !== 'from' && e.name.value !== 'to';
      });
      var fromField = fields.find(function(e) {
        return e.name.value === 'from';
      });
      var fromName = (0, _utils.getNamedType)(fromField).name.value;
      var toField = fields.find(function(e) {
        return e.name.value === 'to';
      });
      var toName = (0, _utils.getNamedType)(toField).name.value;
      // only generate an input type for the relationship if we know that both
      // the from and to nodes are not excluded, since thus we know that
      // relation mutations are generated for this relation, which would
      // make use of the relation input type
      var shouldCreateRelationInput = shouldAugmentRelationField({
        config: config,
        operationType: mutationType,
        fromName: fromName,
        toName: toName
      });
      if (hasSomePropertyField && shouldCreateRelationInput) {
        typeMap[inputName] = (0, _graphql.parse)(
          'input ' +
            inputName +
            ' {' +
            fields
              .reduce(function(acc, t) {
                fieldName = t.name.value;
                isRequired = (0, _utils.isNonNullType)(t);
                if (
                  fieldName !== '_id' &&
                  fieldName !== 'to' &&
                  fieldName !== 'from' &&
                  !(0, _utils.isListType)(t) &&
                  !(0, _utils.getFieldDirective)(t, 'cypher')
                ) {
                  valueTypeName = (0, _utils.getNamedType)(t).name.value;
                  valueType = typeMap[valueTypeName];
                  if ((0, _utils.isTemporalType)(valueTypeName)) {
                    acc.push(t.name.value + ': ' + valueTypeName + 'Input');
                  } else if (
                    (0, _utils.isBasicScalar)(valueTypeName) ||
                    (0, _utils.isKind)(valueType, 'EnumTypeDefinition') ||
                    (0, _utils.isKind)(valueType, 'ScalarTypeDefinition')
                  ) {
                    acc.push(
                      t.name.value +
                        ': ' +
                        valueTypeName +
                        (isRequired ? '!' : '')
                    );
                  }
                }
                return acc;
              }, [])
              .join('\n') +
            '}'
        );
      }
    }
  }
  return typeMap;
};

var possiblyAddQuery = function possiblyAddQuery(astNode, typeMap, queryMap) {
  if ((0, _utils.isNodeType)(astNode)) {
    var name = astNode.name.value;
    if (queryMap[name] === undefined) {
      typeMap.Query.fields.push({
        kind: 'FieldDefinition',
        name: {
          kind: 'Name',
          value: name
        },
        arguments: createQueryArguments(astNode, typeMap),
        type: {
          kind: 'ListType',
          type: {
            kind: 'NamedType',
            name: {
              kind: 'Name',
              value: name
            }
          }
        },
        directives: []
      });
    }
  }
  return typeMap;
};

var possiblyAddOrderingEnum = function possiblyAddOrderingEnum(
  astNode,
  typeMap
) {
  if ((0, _utils.isNodeType)(astNode)) {
    var name = '_' + astNode.name.value + 'Ordering';
    var values = createOrderingFields(astNode.fields, typeMap);
    // Add ordering enum if it does not exist already and if
    // there is at least one basic scalar field on this type
    if (typeMap[name] === undefined && values.length > 0) {
      typeMap[name] = {
        kind: 'EnumTypeDefinition',
        name: {
          kind: 'Name',
          value: name
        },
        directives: [],
        values: values
      };
    }
  }
  return typeMap;
};

var possiblyAddTypeMutations = function possiblyAddTypeMutations(_ref2) {
  var astNode = _ref2.astNode,
    typeMap = _ref2.typeMap,
    mutationMap = _ref2.mutationMap,
    config = _ref2.config,
    mutationType = _ref2.mutationType,
    typeName = _ref2.typeName;

  if (
    (0, _utils.isNodeType)(astNode) &&
    shouldAugmentType({
      config: config,
      operationType: mutationType,
      type: typeName
    })
  ) {
    typeMap = possiblyAddTypeMutation('Create', astNode, typeMap, mutationMap);
    typeMap = possiblyAddTypeMutation('Update', astNode, typeMap, mutationMap);
    typeMap = possiblyAddTypeMutation('Delete', astNode, typeMap, mutationMap);
  }
  return typeMap;
};

var handleRelationFields = function handleRelationFields(_ref3) {
  var astNode = _ref3.astNode,
    typeMap = _ref3.typeMap,
    mutationMap = _ref3.mutationMap,
    config = _ref3.config,
    queryType = _ref3.queryType,
    mutationType = _ref3.mutationType;

  var typeName = astNode.name.value;
  var fields = astNode.fields;
  var fieldCount = fields ? fields.length : 0;
  var relationFieldDirective = {};
  var fieldValueName = '';
  var relatedAstNode = {};
  var relationTypeDirective = {};
  var capitalizedFieldName = '';
  var field = {};
  var fieldIndex = 0;
  if ((0, _utils.isNodeType)(astNode)) {
    for (; fieldIndex < fieldCount; ++fieldIndex) {
      field = fields[fieldIndex];
      fieldValueName = (0, _utils.getNamedType)(field).name.value;
      capitalizedFieldName = capitalizeName(field.name.value);
      relatedAstNode = typeMap[fieldValueName];
      if (relatedAstNode) {
        relationTypeDirective = (0, _utils.getTypeDirective)(
          relatedAstNode,
          'relation'
        );
        relationFieldDirective = (0, _utils.getFieldDirective)(
          field,
          'relation'
        );
        // continue if typeName is allowed
        // in either Query or Mutation
        if ((0, _utils.isNodeType)(relatedAstNode)) {
          // the field has a node type
          if (relationFieldDirective) {
            // Relation Mutation API
            // relation directive exists on field
            typeMap = handleRelationFieldDirective({
              relatedAstNode: relatedAstNode,
              typeName: typeName,
              capitalizedFieldName: capitalizedFieldName,
              fieldValueName: fieldValueName,
              relationFieldDirective: relationFieldDirective,
              mutationMap: mutationMap,
              typeMap: typeMap,
              config: config,
              mutationType: mutationType
            });
          }
        } else if (relationTypeDirective) {
          // Query and Relation Mutation API
          // the field value is a non-node type using a relation type directive
          typeMap = handleRelationTypeDirective({
            relatedAstNode: relatedAstNode,
            typeName: typeName,
            fields: fields,
            field: field,
            fieldIndex: fieldIndex,
            capitalizedFieldName: capitalizedFieldName,
            relationTypeDirective: relationTypeDirective,
            config: config,
            queryType: queryType,
            mutationType: mutationType,
            typeMap: typeMap,
            mutationMap: mutationMap
          });
        }
      }
    }
  }
  return typeMap;
};

var validateRelationTypeDirectedFields = function validateRelationTypeDirectedFields(
  typeName,
  fromName,
  toName
) {
  // directive to and from are not the same and neither are equal to this
  if (fromName !== toName && toName !== typeName && fromName !== typeName) {
    throw new Error(
      "The '" +
        field.name.value +
        "' field on the '" +
        typeName +
        "' type uses the '" +
        relatedAstNode.name.value +
        "'\n    but '" +
        relatedAstNode.name.value +
        "' comes from '" +
        fromName +
        "' and goes to '" +
        toName +
        "'"
    );
  }
  return true;
};

var shouldAugmentRelationField = function shouldAugmentRelationField(_ref4) {
  var config = _ref4.config,
    operationType = _ref4.operationType,
    fromName = _ref4.fromName,
    toName = _ref4.toName;

  // validate that both the fromName and toName node types
  // have not been excluded
  return (
    shouldAugmentType({
      config: config,
      operationType: operationType,
      type: fromName
    }) &&
    shouldAugmentType({
      config: config,
      operationType: operationType,
      type: toName
    })
  );
};

var handleRelationTypeDirective = function handleRelationTypeDirective(_ref5) {
  var relatedAstNode = _ref5.relatedAstNode,
    typeName = _ref5.typeName,
    fields = _ref5.fields,
    field = _ref5.field,
    fieldIndex = _ref5.fieldIndex,
    capitalizedFieldName = _ref5.capitalizedFieldName,
    relationTypeDirective = _ref5.relationTypeDirective,
    config = _ref5.config,
    queryType = _ref5.queryType,
    mutationType = _ref5.mutationType,
    typeMap = _ref5.typeMap,
    mutationMap = _ref5.mutationMap;

  var typeDirectiveArgs = relationTypeDirective
    ? relationTypeDirective.arguments
    : [];
  var nameArgument = typeDirectiveArgs.find(function(e) {
    return e.name.value === 'name';
  });
  var fromArgument = typeDirectiveArgs.find(function(e) {
    return e.name.value === 'from';
  });
  var toArgument = typeDirectiveArgs.find(function(e) {
    return e.name.value === 'to';
  });
  var relationName = nameArgument.value.value;
  var fromName = fromArgument.value.value;
  var toName = toArgument.value.value;
  // Relation Mutation API, adds relation mutation to Mutation
  if (
    shouldAugmentRelationField({
      config: config,
      operationType: mutationType,
      fromName: fromName,
      toName: toName
    }) &&
    validateRelationTypeDirectedFields(typeName, fromName, toName)
  ) {
    typeMap = possiblyAddRelationMutationField(
      typeName,
      capitalizedFieldName,
      fromName,
      toName,
      mutationMap,
      typeMap,
      relationName,
      relatedAstNode,
      true
    );
  }
  // Relation type field payload transformation for selection sets
  typeMap = possiblyAddRelationTypeFieldPayload(
    relatedAstNode,
    capitalizedFieldName,
    typeName,
    typeMap,
    field
  );
  // Replaces the field's value with the generated payload type
  fields[fieldIndex] = replaceRelationTypeValue(
    fromName,
    toName,
    field,
    capitalizedFieldName,
    typeName
  );
  return typeMap;
};

var handleRelationFieldDirective = function handleRelationFieldDirective(
  _ref6
) {
  var relatedAstNode = _ref6.relatedAstNode,
    typeName = _ref6.typeName,
    capitalizedFieldName = _ref6.capitalizedFieldName,
    fieldValueName = _ref6.fieldValueName,
    relationFieldDirective = _ref6.relationFieldDirective,
    mutationMap = _ref6.mutationMap,
    typeMap = _ref6.typeMap,
    config = _ref6.config,
    mutationType = _ref6.mutationType;

  var fromName = typeName;
  var toName = fieldValueName;
  // Mutation API, relation mutations for field directives
  if (
    shouldAugmentRelationField({
      config: config,
      operationType: mutationType,
      fromName: fromName,
      toName: toName
    })
  ) {
    var relationName = (0, _utils.getRelationName)(relationFieldDirective);
    var direction = (0, _utils.getRelationDirection)(relationFieldDirective);
    // possibly swap directions to fit assertion of fromName = typeName
    if (direction === 'IN' || direction === 'in') {
      var temp = fromName;
      fromName = toName;
      toName = temp;
    }
    // (Mutation API) add relation mutation to Mutation
    typeMap = possiblyAddRelationMutationField(
      typeName,
      capitalizedFieldName,
      fromName,
      toName,
      mutationMap,
      typeMap,
      relationName,
      relatedAstNode,
      false
    );
  }
  return typeMap;
};

var possiblyAddTypeFieldArguments = function possiblyAddTypeFieldArguments(
  astNode,
  typeMap,
  config,
  queryType
) {
  var fields = astNode.fields;
  var relationTypeName = '';
  var relationType = {};
  var args = [];
  fields.forEach(function(field) {
    relationTypeName = (0, _utils.getNamedType)(field).name.value;
    relationType = typeMap[relationTypeName];
    if (
      // only adds args if node payload type has not been excluded
      shouldAugmentType({
        config: config,
        operationType: queryType,
        type: relationTypeName
      }) &&
      // we know astNode is a node type, so this field should be a node type
      // as well, since the generated args are only for node type lists
      (0, _utils.isNodeType)(relationType) &&
      // the args (first / offset / orderBy) are only generated for list fields
      (0, _utils.isListType)(field) &&
      ((0, _utils.getFieldDirective)(field, 'relation') ||
        (0, _utils.getFieldDirective)(field, 'cypher'))
    ) {
      args = field.arguments;
      field.arguments = possiblyAddArgument(args, 'first', 'Int');
      field.arguments = possiblyAddArgument(args, 'offset', 'Int');
      field.arguments = possiblyAddArgument(
        args,
        'orderBy',
        '_' + relationTypeName + 'Ordering'
      );
    }
  });
  return fields;
};

var possiblyAddObjectType = function possiblyAddObjectType(typeMap, name) {
  if (typeMap[name] === undefined) {
    typeMap[name] = {
      kind: 'ObjectTypeDefinition',
      name: {
        kind: 'Name',
        value: name
      },
      interfaces: [],
      directives: [],
      fields: []
    };
  }
  return typeMap;
};

var decideFieldType = function decideFieldType(name) {
  if ((0, _utils.isTemporalType)(name)) {
    name = name + 'Input';
  }
  return name;
};

var createOrderingFields = function createOrderingFields(fields, typeMap) {
  var type = {};
  return fields.reduce(function(acc, t) {
    type = (0, _utils.getNamedType)(t);
    if ((0, _utils.isBasicScalar)(type.name.value)) {
      acc.push({
        kind: 'EnumValueDefinition',
        name: {
          kind: 'Name',
          value: t.name.value + '_asc'
        },
        directives: []
      });
      acc.push({
        kind: 'EnumValueDefinition',
        name: {
          kind: 'Name',
          value: t.name.value + '_desc'
        },
        directives: []
      });
    }
    return acc;
  }, []);
};

var buildAllFieldArguments = function buildAllFieldArguments(
  namePrefix,
  astNode,
  typeMap
) {
  var fields = [];
  var type = {};
  var fieldName = '';
  var valueTypeName = '';
  var valueType = {};
  switch (namePrefix) {
    case 'Create': {
      var firstIdField = undefined;
      astNode.fields.reduce(function(acc, t) {
        type = (0, _utils.getNamedType)(t);
        fieldName = t.name.value;
        valueTypeName = type.name.value;
        valueType = typeMap[valueTypeName];
        // If this field is not _id, and not a list,
        // and is not computed, and either a basic scalar
        // or an enum
        if (
          (0, _utils.isTemporalType)(valueTypeName) ||
          (fieldName !== '_id' &&
            !(0, _utils.isListType)(t) &&
            !(0, _utils.getFieldDirective)(t, 'cypher') &&
            ((0, _utils.isBasicScalar)(valueTypeName) ||
              (0, _utils.isKind)(valueType, 'EnumTypeDefinition') ||
              (0, _utils.isKind)(valueType, 'ScalarTypeDefinition')))
        ) {
          // TOOD list type arguments?
          // Require if required
          if ((0, _utils.isNonNullType)(t)) {
            // Don't require the first ID field discovered
            // TODO check existential consistency of valueTypeName, given results with
            if (valueTypeName === 'ID' && !firstIdField) {
              // will only be true once, this field will
              // by default recieve an auto-generated uuid,
              // if no value is provided
              firstIdField = t;
              acc.push({
                kind: 'InputValueDefinition',
                name: {
                  kind: 'Name',
                  value: fieldName
                },
                type: type,
                directives: []
              });
            } else {
              acc.push({
                kind: 'InputValueDefinition',
                name: {
                  kind: 'Name',
                  value: fieldName
                },
                type: {
                  kind: 'NonNullType',
                  type: {
                    kind: 'NamedType',
                    name: {
                      kind: 'Name',
                      value: decideFieldType(valueTypeName)
                    }
                  }
                },
                directives: []
              });
            }
          } else {
            acc.push({
              kind: 'InputValueDefinition',
              name: {
                kind: 'Name',
                value: fieldName
              },
              type: {
                kind: 'NamedType',
                name: {
                  kind: 'Name',
                  value: decideFieldType(valueTypeName)
                }
              },
              directives: []
            });
          }
        }
        return acc;
      }, fields);
      break;
    }
    case 'Update': {
      var primaryKey = (0, _utils.getPrimaryKey)(astNode);
      var augmentedFields = [];
      if (primaryKey) {
        // Primary key field is first field and required
        var primaryKeyName = primaryKey.name.value;
        var primaryKeyType = (0, _utils.getNamedType)(primaryKey);
        augmentedFields.push({
          kind: 'InputValueDefinition',
          name: {
            kind: 'Name',
            value: primaryKeyName
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: {
                kind: 'Name',
                value: decideFieldType(primaryKeyType.name.value)
              }
            }
          },
          directives: []
        });
        astNode.fields.reduce(function(acc, t) {
          type = (0, _utils.getNamedType)(t);
          fieldName = t.name.value;
          valueTypeName = type.name.value;
          valueType = typeMap[valueTypeName];
          // If this field is not the primary key, and not _id,
          // and not a list, and not computed, and either a basic
          // scalar or an enum
          if (
            (fieldName !== primaryKeyName &&
              fieldName !== '_id' &&
              !(0, _utils.isListType)(t) &&
              !(0, _utils.getFieldDirective)(t, 'cypher') &&
              ((0, _utils.isBasicScalar)(valueTypeName) ||
                (0, _utils.isKind)(valueType, 'EnumTypeDefinition') ||
                (0, _utils.isKind)(valueType, 'ScalarTypeDefinition'))) ||
            (0, _utils.isTemporalType)(valueTypeName)
          ) {
            acc.push({
              kind: 'InputValueDefinition',
              name: {
                kind: 'Name',
                value: fieldName
              },
              type: {
                kind: 'NamedType',
                name: {
                  kind: 'Name',
                  value: decideFieldType(valueTypeName)
                }
              },
              directives: []
            });
          }
          return acc;
        }, augmentedFields);
        // Use if there is at least one field other than
        // the primaryKey field used for node selection
        if (augmentedFields.length > 1) {
          fields = augmentedFields;
        }
      }
      break;
    }
    case 'Delete': {
      var _primaryKey = (0, _utils.getPrimaryKey)(astNode);
      var _primaryKeyName = _primaryKey.name.value;
      var _primaryKeyType = (0, _utils.getNamedType)(_primaryKey);
      fields.push({
        kind: 'InputValueDefinition',
        name: {
          kind: 'Name',
          value: _primaryKeyName
        },
        type: {
          kind: 'NonNullType',
          type: {
            kind: 'NamedType',
            name: {
              kind: 'Name',
              value: decideFieldType(_primaryKeyType.name.value)
            }
          }
        },
        directives: []
      });
      break;
    }
  }
  return fields;
};

var possiblyAddTypeMutation = function possiblyAddTypeMutation(
  namePrefix,
  astNode,
  typeMap,
  mutationMap
) {
  var typeName = astNode.name.value;
  var mutationName = namePrefix + typeName;
  // Only generate if the mutation named mutationName does not already exist
  if (mutationMap[mutationName] === undefined) {
    var args = buildAllFieldArguments(namePrefix, astNode, typeMap);
    if (args.length > 0) {
      typeMap.Mutation.fields.push({
        kind: 'FieldDefinition',
        name: {
          kind: 'Name',
          value: mutationName
        },
        arguments: args,
        type: {
          kind: 'NamedType',
          name: {
            kind: 'Name',
            value: typeName
          }
        },
        directives: []
      });
    }
  }
  return typeMap;
};

var replaceRelationTypeValue = function replaceRelationTypeValue(
  fromName,
  toName,
  field,
  capitalizedFieldName,
  typeName
) {
  var isList = (0, _utils.isListType)(field);
  var type = {
    kind: 'NamedType',
    name: {
      kind: 'Name',
      value:
        '_' +
        typeName +
        capitalizedFieldName +
        (fromName === toName ? 'Directions' : '')
    }
  };
  if (isList && fromName !== toName) {
    type = {
      kind: 'ListType',
      type: type
    };
  }
  field.type = type;
  return field;
};

var possiblyAddRelationTypeFieldPayload = function possiblyAddRelationTypeFieldPayload(
  relationAstNode,
  capitalizedFieldName,
  typeName,
  typeMap,
  field
) {
  var fieldTypeName = '_' + typeName + capitalizedFieldName;
  if (!typeMap[fieldTypeName]) {
    var fieldName = '';
    var fieldValueName = '';
    var fromField = {};
    var toField = {};
    var _fromField = {};
    var _toField = {};
    var fromValue = undefined;
    var toValue = undefined;
    var fields = relationAstNode.fields;
    var relationTypeDirective = (0, _utils.getRelationTypeDirectiveArgs)(
      relationAstNode
    );
    if (relationTypeDirective) {
      var relationPropertyFields = fields
        .reduce(function(acc, t) {
          fieldValueName = (0, _utils.getNamedType)(t).name.value;
          fieldName = t.name.value;
          if (fieldName === 'from') {
            fromValue = fieldValueName;
            fromField = t;
          } else if (fieldName === 'to') {
            toValue = fieldValueName;
            toField = t;
          } else {
            // Exclude .to and .from, but gather them from along the way
            // using previous branches above
            acc.push(
              fieldName +
                ': ' +
                fieldValueName +
                ' ' +
                (0, _graphql.print)(t.directives)
            );
          }
          return acc;
        }, [])
        .join('\n');
      if (fromValue && fromValue === toValue) {
        // If field is a list type, then make .from and .to list types
        var fieldIsList = (0, _utils.isListType)(field);

        typeMap[fieldTypeName + 'Directions'] = (0, _graphql.parse)(
          '\n            type ' +
            fieldTypeName +
            'Directions ' +
            (0, _graphql.print)(relationAstNode.directives) +
            ' {\n              from' +
            (0, _utils.getFieldArgumentsFromAst)(field, typeName) +
            ': ' +
            (fieldIsList ? '[' : '') +
            fieldTypeName +
            (fieldIsList ? ']' : '') +
            '\n              to' +
            (0, _utils.getFieldArgumentsFromAst)(field, typeName) +
            ': ' +
            (fieldIsList ? '[' : '') +
            fieldTypeName +
            (fieldIsList ? ']' : '') +
            '\n            }'
        );

        typeMap[fieldTypeName] = (0, _graphql.parse)(
          '\n            type ' +
            fieldTypeName +
            ' ' +
            (0, _graphql.print)(relationAstNode.directives) +
            ' {\n              ' +
            relationPropertyFields +
            '\n              ' +
            fromValue +
            ': ' +
            fromValue +
            '\n            }\n          '
        );

        // remove arguments on field
        field.arguments = [];
      } else {
        // Non-reflexive case, (User)-[RATED]->(Movie)
        typeMap[fieldTypeName] = (0, _graphql.parse)(
          '\n            type ' +
            fieldTypeName +
            ' ' +
            (0, _graphql.print)(relationAstNode.directives) +
            ' {\n              ' +
            relationPropertyFields +
            '\n              ' +
            (typeName === toValue // If this is the from, the allow selecting the to
              ? fromValue + ': ' + fromValue // else this is the to, so allow selecting the from
              : typeName === fromValue
              ? toValue + ': ' + toValue
              : '') +
            '\n              }\n          '
        );
      }
    }
  }
  return typeMap;
};

var addOrReplaceNodeIdField = function addOrReplaceNodeIdField(astNode) {
  var fields = astNode ? astNode.fields : [];
  var index = fields.findIndex(function(e) {
    return e.name.value === '_id';
  });
  var definition = {
    kind: 'FieldDefinition',
    name: {
      kind: 'Name',
      value: '_id'
    },
    arguments: [],
    type: {
      kind: 'NamedType',
      name: {
        kind: 'Name',
        value: 'String'
      }
    },
    directives: []
  };
  // If it has already been provided, replace it to force valueType,
  // else add it as the last field
  index >= 0 ? fields.splice(index, 1, definition) : fields.push(definition);
  return fields;
};

var possiblyAddRelationMutationField = function possiblyAddRelationMutationField(
  typeName,
  capitalizedFieldName,
  fromName,
  toName,
  mutationMap,
  typeMap,
  relationName,
  relatedAstNode,
  relationHasProps
) {
  var mutationTypes = ['Add', 'Remove'];
  var mutationName = '';
  var payloadTypeName = '';
  var hasSomePropertyField = false;
  mutationTypes.forEach(function(action) {
    mutationName = '' + action + typeName + capitalizedFieldName;
    // Prevents overwriting
    if (mutationMap[mutationName] === undefined) {
      payloadTypeName = '_' + mutationName + 'Payload';
      hasSomePropertyField = relatedAstNode.fields.find(function(e) {
        return e.name.value !== 'from' && e.name.value !== 'to';
      });
      // If we know we should expect data properties (from context: relationHasProps)
      // and if there is at least 1 field that is not .to or .from (hasSomePropertyField)
      // and if we are generating the add relation mutation, then add the .data argument
      var shouldUseRelationDataArgument =
        relationHasProps && hasSomePropertyField && action === 'Add';
      // Relation mutation type
      typeMap.Mutation.fields.push(
        (0, _utils.parseFieldSdl)(
          '\n        ' +
            mutationName +
            '(from: _' +
            fromName +
            'Input!, to: _' +
            toName +
            'Input!' +
            (shouldUseRelationDataArgument
              ? ', data: _' + relatedAstNode.name.value + 'Input!'
              : '') +
            '): ' +
            payloadTypeName +
            ' @MutationMeta(relationship: "' +
            relationName +
            '", from: "' +
            fromName +
            '", to: "' +
            toName +
            '")\n      '
        )
      );
      // Prevents overwriting
      if (typeMap[payloadTypeName] === undefined) {
        typeMap[payloadTypeName] = (0, _graphql.parse)(
          '\n          type ' +
            payloadTypeName +
            ' @relation(name: "' +
            relationName +
            '", from: "' +
            fromName +
            '", to: "' +
            toName +
            '") {\n            from: ' +
            fromName +
            '\n            to: ' +
            toName +
            '\n            ' +
            (shouldUseRelationDataArgument
              ? (0, _utils.getRelationMutationPayloadFieldsFromAst)(
                  relatedAstNode
                )
              : '') +
            '\n          }\n        '
        );
      }
    }
  });
  return typeMap;
};

var capitalizeName = function capitalizeName(name) {
  return name.charAt(0).toUpperCase() + name.substr(1);
};

var createQueryArguments = function createQueryArguments(astNode, typeMap) {
  var type = {};
  var valueTypeName = '';
  astNode.fields = addOrReplaceNodeIdField(astNode);
  return astNode.fields.reduce(function(acc, t) {
    type = (0, _utils.getNamedType)(t);
    valueTypeName = type.name.value;
    if (isQueryArgumentFieldType(type, typeMap[valueTypeName])) {
      acc.push({
        kind: 'InputValueDefinition',
        name: {
          kind: 'Name',
          value: t.name.value
        },
        type: type,
        directives: []
      });
    } else if ((0, _utils.isTemporalType)(valueTypeName)) {
      acc.push({
        kind: 'InputValueDefinition',
        name: {
          kind: 'Name',
          value: t.name.value
        },
        type: {
          kind: 'NamedType',
          name: {
            kind: 'Name',
            value: valueTypeName + 'Input'
          }
        },
        directives: []
      });
    }
    return acc;
  }, []);
};

var isQueryArgumentFieldType = function isQueryArgumentFieldType(
  type,
  valueType
) {
  return (
    (0, _utils.isBasicScalar)(type.name.value) ||
    (0, _utils.isKind)(valueType, 'EnumTypeDefinition') ||
    (0, _utils.isKind)(valueType, 'ScalarTypeDefinition')
  );
};

var hasNonExcludedNodeType = function hasNonExcludedNodeType(
  types,
  typeMap,
  operationType,
  config
) {
  return types.find(function(e) {
    return (
      (0, _utils.isNodeType)(typeMap[e]) &&
      shouldAugmentType({
        config: config,
        operationType: operationType,
        type: typeMap[e].name.value
      })
    );
  });
};

var initializeOperationTypes = function initializeOperationTypes(_ref7) {
  var types = _ref7.types,
    typeMap = _ref7.typeMap,
    config = _ref7.config,
    queryType = _ref7.queryType,
    mutationType = _ref7.mutationType;

  if (hasNonExcludedNodeType(types, typeMap, queryType, config)) {
    typeMap = possiblyAddObjectType(typeMap, queryType);
  }
  if (hasNonExcludedNodeType(types, typeMap, mutationType, config)) {
    typeMap = possiblyAddObjectType(typeMap, mutationType);
  }
  return typeMap;
};

var computeRelationTypeDirectiveDefaults = function computeRelationTypeDirectiveDefaults(
  typeMap
) {
  var astNode = {};
  var fields = [];
  var name = '';
  var to = {};
  var from = {};
  var fromTypeName = '';
  var toTypeName = '';
  var fromAstNode = {};
  var toAstNode = '';
  var typeDirective = {};
  var relationName = '';
  var toName = '';
  var fromName = '';
  var typeDirectiveIndex = -1;
  (0, _keys2.default)(typeMap).forEach(function(typeName) {
    astNode = typeMap[typeName];
    name = astNode.name.value;
    fields = astNode.fields;
    to = fields
      ? fields.find(function(e) {
          return e.name.value === 'to';
        })
      : undefined;
    from = fields
      ? fields.find(function(e) {
          return e.name.value === 'from';
        })
      : undefined;
    if (to && !from)
      throw new Error(
        'Relationship type ' +
          name +
          " has a 'to' field but no corresponding 'from' field"
      );
    if (from && !to)
      throw new Error(
        'Relationship type ' +
          name +
          " has a 'from' field but no corresponding 'to' field"
      );
    if (from && to) {
      // get values of .to and .from fields
      fromTypeName = (0, _utils.getNamedType)(from).name.value;
      toTypeName = (0, _utils.getNamedType)(to).name.value;
      // get the astNodes of those object values
      fromAstNode = typeMap[fromTypeName];
      toAstNode = typeMap[toTypeName];
      // assume the default relationship name
      relationName = transformRelationName(astNode);
      // get its relation type directive
      typeDirectiveIndex = astNode.directives.findIndex(function(e) {
        return e.name.value === 'relation';
      });
      if (typeDirectiveIndex >= 0) {
        typeDirective = astNode.directives[typeDirectiveIndex];
        // get the arguments of type directive
        var args = typeDirective ? typeDirective.arguments : [];
        if (args.length > 0) {
          // get its name argument
          var nameArg = args.find(function(e) {
            return e.name.value === 'name';
          });
          if (nameArg) {
            relationName = nameArg.value.value;
          }
        }
        // replace it if it exists in order to force correct configuration
        // TODO use sdl instead
        astNode.directives[typeDirectiveIndex] = {
          kind: 'Directive',
          name: {
            kind: 'Name',
            value: 'relation'
          },
          arguments: [
            {
              kind: 'Argument',
              name: {
                kind: 'Name',
                value: 'name'
              },
              value: {
                kind: 'StringValue',
                value: relationName
              }
            },
            {
              kind: 'Argument',
              name: {
                kind: 'Name',
                value: 'from'
              },
              value: {
                kind: 'StringValue',
                value: fromTypeName
              }
            },
            {
              kind: 'Argument',
              name: {
                kind: 'Name',
                value: 'to'
              },
              value: {
                kind: 'StringValue',
                value: toTypeName
              }
            }
          ]
        };
      } else {
        astNode.directives.push({
          kind: 'Directive',
          name: {
            kind: 'Name',
            value: 'relation'
          },
          arguments: [
            {
              kind: 'Argument',
              name: {
                kind: 'Name',
                value: 'name'
              },
              value: {
                kind: 'StringValue',
                value: relationName
              }
            },
            {
              kind: 'Argument',
              name: {
                kind: 'Name',
                value: 'from'
              },
              value: {
                kind: 'StringValue',
                value: fromTypeName
              }
            },
            {
              kind: 'Argument',
              name: {
                kind: 'Name',
                value: 'to'
              },
              value: {
                kind: 'StringValue',
                value: toTypeName
              }
            }
          ]
        });
      }
      typeMap[typeName] = astNode;
    }
  });
  return typeMap;
};

var transformRelationName = function transformRelationName(relatedAstNode) {
  var name = relatedAstNode.name.value;
  var char = '';
  var uppercased = '';
  return (0, _keys2.default)(name)
    .reduce(function(acc, t) {
      char = name.charAt(t);
      uppercased = char.toUpperCase();
      if (char === uppercased && t > 0) {
        // already uppercased
        acc.push('_' + uppercased);
      } else {
        acc.push(uppercased);
      }
      return acc;
    }, [])
    .join('');
};

var shouldAugmentType = function shouldAugmentType(_ref8) {
  var _ref8$config = _ref8.config,
    config = _ref8$config === undefined ? {} : _ref8$config,
    _ref8$operationType = _ref8.operationType,
    operationType =
      _ref8$operationType === undefined ? '' : _ref8$operationType,
    type = _ref8.type;

  operationType = (0, _utils.lowFirstLetter)(operationType);
  var typeValue = config[operationType];
  var configType =
    typeof typeValue === 'undefined'
      ? 'undefined'
      : (0, _typeof3.default)(typeValue);
  if (configType === 'boolean') {
    return config[operationType];
  } else if (configType === 'object') {
    var excludes = typeValue.exclude;
    if (Array.isArray(excludes)) {
      if (type) {
        return !excludes.includes(type);
      }
    }
  }
  return true;
};

var temporalTypes = function temporalTypes(typeMap, types) {
  if (types.time === true) {
    typeMap['_Neo4jTime'] = (0, _graphql.parse)(
      '\n      type _Neo4jTime {\n        hour: Int\n        minute: Int\n        second: Int\n        millisecond: Int\n        microsecond: Int\n        nanosecond: Int\n        timezone: String\n        formatted: String\n      }\n    '
    ).definitions[0];
    typeMap['_Neo4jTimeInput'] = (0, _graphql.parse)(
      '\n      input _Neo4jTimeInput {\n        hour: Int\n        minute: Int\n        second: Int\n        nanosecond: Int\n        millisecond: Int\n        microsecond: Int\n        timezone: String\n        formatted: String\n      }\n    '
    ).definitions[0];
  }
  if (types.date === true) {
    typeMap['_Neo4jDate'] = (0, _graphql.parse)(
      '\n      type _Neo4jDate {\n        year: Int\n        month: Int\n        day: Int\n        formatted: String\n      }\n    '
    ).definitions[0];
    typeMap['_Neo4jDateInput'] = (0, _graphql.parse)(
      '\n      input _Neo4jDateInput {\n        year: Int\n        month: Int\n        day: Int\n        formatted: String\n      }\n    '
    ).definitions[0];
  }
  if (types.datetime === true) {
    typeMap['_Neo4jDateTime'] = (0, _graphql.parse)(
      '\n      type _Neo4jDateTime {\n        year: Int\n        month: Int\n        day: Int\n        hour: Int\n        minute: Int\n        second: Int\n        millisecond: Int\n        microsecond: Int\n        nanosecond: Int\n        timezone: String\n        formatted: String\n      }\n    '
    ).definitions[0];
    typeMap['_Neo4jDateTimeInput'] = (0, _graphql.parse)(
      '\n      input _Neo4jDateTimeInput {\n        year: Int\n        month: Int\n        day: Int\n        hour: Int\n        minute: Int\n        second: Int\n        millisecond: Int\n        microsecond: Int\n        nanosecond: Int\n        timezone: String \n        formatted: String\n      }\n    '
    ).definitions[0];
  }
  if (types.localtime === true) {
    typeMap['_Neo4jLocalTime'] = (0, _graphql.parse)(
      '\n      type _Neo4jLocalTime {\n        hour: Int\n        minute: Int\n        second: Int\n        millisecond: Int\n        microsecond: Int\n        nanosecond: Int\n        formatted: String\n      }\n    '
    ).definitions[0];
    typeMap['_Neo4jLocalTimeInput'] = (0, _graphql.parse)(
      '\n      input _Neo4jLocalTimeInput {\n        hour: Int\n        minute: Int\n        second: Int\n        millisecond: Int\n        microsecond: Int\n        nanosecond: Int\n        formatted: String\n      }\n    '
    ).definitions[0];
  }
  if (types.localdatetime === true) {
    typeMap['_Neo4jLocalDateTime'] = (0, _graphql.parse)(
      '\n      type _Neo4jLocalDateTime {\n        year: Int\n        month: Int\n        day: Int\n        hour: Int\n        minute: Int\n        second: Int\n        millisecond: Int\n        microsecond: Int\n        nanosecond: Int\n        formatted: String\n      }\n    '
    ).definitions[0];
    typeMap['_Neo4jLocalDateTimeInput'] = (0, _graphql.parse)(
      '\n      input _Neo4jLocalDateTimeInput {\n        year: Int\n        month: Int\n        day: Int\n        hour: Int\n        minute: Int\n        second: Int\n        millisecond: Int\n        microsecond: Int\n        nanosecond: Int\n        formatted: String\n      }\n    '
    ).definitions[0];
  }
  return typeMap;
};

var transformTemporalFieldArgs = function transformTemporalFieldArgs(
  field,
  config
) {
  field.arguments.forEach(function(arg) {
    arg.type = transformTemporalTypeName(arg.type, config, true);
  });
  return field;
};

var transformTemporalFields = function transformTemporalFields(
  typeMap,
  config
) {
  var astNode = {};
  // let typeName = "";
  (0, _keys2.default)(typeMap).forEach(function(t) {
    astNode = typeMap[t];
    if ((0, _utils.isNodeType)(astNode)) {
      // typeName = astNode.name.value;
      if (!(0, _utils.isTemporalType)(t)) {
        astNode.fields.forEach(function(field) {
          // released: DateTime -> released: _Neo4jDateTime
          field.type = transformTemporalTypeName(field.type, config);
          field = transformTemporalFieldArgs(field, config);
        });
      }
    }
  });
  return typeMap;
};

var transformTemporalTypeName = function transformTemporalTypeName(
  type,
  config,
  isArgument
) {
  if (type.kind !== 'NamedType') {
    type.type = transformTemporalTypeName(type.type, config);
    return type;
  }
  if (type.kind === 'NamedType') {
    switch (type.name.value) {
      case 'Time': {
        if (config.time === true) {
          type.name.value = '_Neo4jTime' + (isArgument ? 'Input' : '');
        }
        break;
      }
      case 'Date': {
        if (config.date === true) {
          type.name.value = '_Neo4jDate' + (isArgument ? 'Input' : '');
        }
        break;
      }
      case 'DateTime': {
        if (config.datetime === true) {
          type.name.value = '_Neo4jDateTime' + (isArgument ? 'Input' : '');
        }
        break;
      }
      case 'LocalTime': {
        if (config.localtime === true) {
          type.name.value = '_Neo4jLocalTime' + (isArgument ? 'Input' : '');
        }
        break;
      }
      case 'LocalDateTime': {
        if (config.localdatetime === true) {
          type.name.value = '_Neo4jLocalDateTime' + (isArgument ? 'Input' : '');
        }
        break;
      }
      default:
        break;
    }
  }
  return type;
};

var decideTemporalConfig = function decideTemporalConfig(config) {
  var defaultConfig = {
    time: true,
    date: true,
    datetime: true,
    localtime: true,
    localdatetime: true
  };
  var providedConfig = config ? config.temporal : defaultConfig;
  if (typeof providedConfig === 'boolean') {
    if (providedConfig === false) {
      defaultConfig.time = false;
      defaultConfig.date = false;
      defaultConfig.datetime = false;
      defaultConfig.localtime = false;
      defaultConfig.localdatetime = false;
    }
  } else if (
    (typeof providedConfig === 'undefined'
      ? 'undefined'
      : (0, _typeof3.default)(providedConfig)) === 'object'
  ) {
    (0, _keys2.default)(defaultConfig).forEach(function(e) {
      if (providedConfig[e] === undefined) {
        providedConfig[e] = defaultConfig[e];
      }
    });
    defaultConfig = providedConfig;
  }
  return defaultConfig;
};

var addTemporalTypes = (exports.addTemporalTypes = function addTemporalTypes(
  typeMap,
  config
) {
  config = decideTemporalConfig(config);
  typeMap = temporalTypes(typeMap, config);
  return transformTemporalFields(typeMap, config);
});
