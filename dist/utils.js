'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.getTemporalArguments = exports.isTemporalField = exports.isTemporalType = exports.filterNullParams = exports.getMutationSelections = exports.getQuerySelections = exports.getOuterSkipLimit = exports.getMutationCypherDirective = exports.getQueryCypherDirective = exports.initializeMutationParams = exports.addDirectiveDeclarations = exports.extractTypeMapFromTypeDefs = exports.decideNestedVariableName = exports.printTypeMap = exports.safeLabel = exports.safeVar = exports.getRelationName = exports.getRelationDirection = exports.parseFieldSdl = exports.isNodeType = exports.createOperationMap = exports.isNonNullType = exports.getFieldDirective = exports.getTypeDirective = exports.getPrimaryKey = exports.isBasicScalar = exports.getNamedType = exports.getFieldValueType = exports.getRelationMutationPayloadFieldsFromAst = exports.getFieldArgumentsFromAst = exports.getRelationTypeDirectiveArgs = exports.parameterizeRelationFields = exports.isListType = exports.isKind = exports.buildCypherParameters = exports.getMutationArguments = exports.getQueryArguments = exports.possiblySetFirstId = exports.computeOrderBy = exports.relationDirective = exports.cypherDirective = exports.isRemoveMutation = exports.isDeleteMutation = exports.isUpdateMutation = exports.isAddMutation = exports.isCreateMutation = undefined;

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _values = require('babel-runtime/core-js/object/values');

var _values2 = _interopRequireDefault(_values);

var _isInteger = require('babel-runtime/core-js/number/is-integer');

var _isInteger2 = _interopRequireDefault(_isInteger);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _entries = require('babel-runtime/core-js/object/entries');

var _entries2 = _interopRequireDefault(_entries);

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

exports.parseArgs = parseArgs;
exports.cypherDirectiveArgs = cypherDirectiveArgs;
exports.isMutation = isMutation;
exports._isNamedMutation = _isNamedMutation;
exports.isAddRelationshipMutation = isAddRelationshipMutation;
exports.typeIdentifiers = typeIdentifiers;
exports.isGraphqlScalarType = isGraphqlScalarType;
exports.isArrayType = isArrayType;
exports.lowFirstLetter = lowFirstLetter;
exports.innerType = innerType;
exports.filtersFromSelections = filtersFromSelections;
exports.getFilterParams = getFilterParams;
exports.innerFilterParams = innerFilterParams;
exports.extractQueryResult = extractQueryResult;
exports.computeSkipLimit = computeSkipLimit;
exports.extractSelections = extractSelections;
exports.fixParamsForAddRelationshipMutation = fixParamsForAddRelationshipMutation;
exports.temporalPredicateClauses = temporalPredicateClauses;

var _graphql = require('graphql');

var _augment = require('./augment');

var _neo4jDriver = require('neo4j-driver');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _filter = require('lodash/filter');

var _filter2 = _interopRequireDefault(_filter);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function parseArg(arg, variableValues) {
  switch (arg.value.kind) {
    case 'IntValue':
      return parseInt(arg.value.value);
      break;
    case 'FloatValue':
      return parseFloat(arg.value.value);
      break;
    case 'Variable':
      return variableValues[arg.name.value];
      break;
    default:
      return arg.value.value;
  }
}

function parseArgs(args, variableValues) {
  if (!args || args.length === 0) {
    return {};
  }
  return args.reduce(function(acc, arg) {
    acc[arg.name.value] = parseArg(arg, variableValues);
    return acc;
  }, {});
}

function getDefaultArguments(fieldName, schemaType) {
  // get default arguments for this field from schema

  try {
    return schemaType._fields[fieldName].args.reduce(function(acc, arg) {
      acc[arg.name] = arg.defaultValue;
      return acc;
    }, {});
  } catch (err) {
    return {};
  }
}

function cypherDirectiveArgs(variable, headSelection, schemaType, resolveInfo) {
  var defaultArgs = getDefaultArguments(headSelection.name.value, schemaType);
  var queryArgs = parseArgs(
    headSelection.arguments,
    resolveInfo.variableValues
  );

  var args = (0, _stringify2.default)(
    (0, _assign2.default)(defaultArgs, queryArgs)
  ).replace(/\"([^(\")"]+)\":/g, ' $1: ');

  return args === '{}'
    ? '{this: ' + variable + args.substring(1)
    : '{this: ' + variable + ',' + args.substring(1);
}

function isMutation(resolveInfo) {
  return resolveInfo.operation.operation === 'mutation';
}

function _isNamedMutation(name) {
  return function(resolveInfo) {
    return (
      isMutation(resolveInfo) &&
      resolveInfo.fieldName.split(/(?=[A-Z])/)[0].toLowerCase() ===
        name.toLowerCase()
    );
  };
}

var isCreateMutation = (exports.isCreateMutation = _isNamedMutation('create'));

var isAddMutation = (exports.isAddMutation = _isNamedMutation('add'));

var isUpdateMutation = (exports.isUpdateMutation = _isNamedMutation('update'));

var isDeleteMutation = (exports.isDeleteMutation = _isNamedMutation('delete'));

var isRemoveMutation = (exports.isRemoveMutation = _isNamedMutation('remove'));

function isAddRelationshipMutation(resolveInfo) {
  return (
    isAddMutation(resolveInfo) &&
    resolveInfo.schema
      .getMutationType()
      .getFields()
      [resolveInfo.fieldName].astNode.directives.some(function(x) {
        return x.name.value === 'MutationMeta';
      })
  );
}

function typeIdentifiers(returnType) {
  var typeName = innerType(returnType).toString();
  return {
    variableName: lowFirstLetter(typeName),
    typeName: typeName
  };
}

function isGraphqlScalarType(type) {
  return (
    type.constructor.name === 'GraphQLScalarType' ||
    type.constructor.name === 'GraphQLEnumType'
  );
}

function isArrayType(type) {
  return type.toString().startsWith('[');
}

function lowFirstLetter(word) {
  return word.charAt(0).toLowerCase() + word.slice(1);
}

function innerType(type) {
  return type.ofType ? innerType(type.ofType) : type;
}

// handles field level schema directives
// TODO: refactor to handle Query/Mutation type schema directives
var directiveWithArgs = function directiveWithArgs(directiveName, args) {
  return function(schemaType, fieldName) {
    function fieldDirective(schemaType, fieldName, directiveName) {
      return schemaType
        .getFields()
        [fieldName].astNode.directives.find(function(e) {
          return e.name.value === directiveName;
        });
    }

    function directiveArgument(directive, name) {
      return directive.arguments.find(function(e) {
        return e.name.value === name;
      }).value.value;
    }

    var directive = fieldDirective(schemaType, fieldName, directiveName);
    var ret = {};
    if (directive) {
      _assign2.default.apply(
        Object,
        [ret].concat(
          (0, _toConsumableArray3.default)(
            args.map(function(key) {
              return (0,
              _defineProperty3.default)({}, key, directiveArgument(directive, key));
            })
          )
        )
      );
    }
    return ret;
  };
};

var cypherDirective = (exports.cypherDirective = directiveWithArgs('cypher', [
  'statement'
]));
var relationDirective = (exports.relationDirective = directiveWithArgs(
  'relation',
  ['name', 'direction']
));

function filtersFromSelections(selections, variableValues) {
  if (
    selections &&
    selections.length &&
    selections[0].arguments &&
    selections[0].arguments.length
  ) {
    return selections[0].arguments.reduce(function(result, x) {
      (result[x.name.value] = argumentValue(
        selections[0],
        x.name.value,
        variableValues
      )) || x.value.value;
      return result;
    }, {});
  }
  return {};
}

function getFilterParams(filters, index) {
  return (0, _entries2.default)(filters).reduce(function(result, _ref2) {
    var _ref3 = (0, _slicedToArray3.default)(_ref2, 2),
      key = _ref3[0],
      value = _ref3[1];

    result[key] = index
      ? {
          value: value,
          index: index
        }
      : value;
    return result;
  }, {});
}

function innerFilterParams(filters, temporalArgs, paramKey) {
  var temporalArgNames = temporalArgs
    ? temporalArgs.reduce(function(acc, t) {
        acc.push(t.name.value);
        return acc;
      }, [])
    : [];
  return (0, _keys2.default)(filters).length > 0
    ? '{' +
        (0, _entries2.default)(filters)
          // exclude temporal arguments
          .filter(function(_ref4) {
            var _ref5 = (0, _slicedToArray3.default)(_ref4, 1),
              key = _ref5[0];

            return !['first', 'offset', 'orderBy']
              .concat((0, _toConsumableArray3.default)(temporalArgNames))
              .includes(key);
          })
          .map(function(_ref6) {
            var _ref7 = (0, _slicedToArray3.default)(_ref6, 2),
              key = _ref7[0],
              value = _ref7[1];

            return (
              key +
              ':' +
              (paramKey ? '$' + paramKey + '.' : '$') +
              (typeof value.index === 'undefined'
                ? key
                : value.index + '_' + key)
            );
          })
          .join(',') +
        '}'
    : '';
}

function argumentValue(selection, name, variableValues) {
  var arg = selection.arguments.find(function(a) {
    return a.name.value === name;
  });
  if (!arg) {
    return null;
  } else {
    var key = arg.value.name.value;

    try {
      return variableValues[key];
    } catch (e) {
      return argumentValue(selection, name, variableValues);
    }
  }
}

function argumentValue(selection, name, variableValues) {
  var arg = selection.arguments.find(function(a) {
    return a.name.value === name;
  });
  if (!arg) {
    return null;
  } else {
    return parseArg(arg, variableValues);
  }
}

function extractQueryResult(_ref8, returnType) {
  var records = _ref8.records;

  var _typeIdentifiers = typeIdentifiers(returnType),
    variableName = _typeIdentifiers.variableName;

  var result = isArrayType(returnType)
    ? records.map(function(record) {
        return record.get(variableName);
      })
    : records.length
    ? records[0].get(variableName)
    : null;

  result = convertIntegerFields(result);
  return result;
}

var convertIntegerFields = function convertIntegerFields(result) {
  var keys = result ? (0, _keys2.default)(result) : [];
  var field = undefined;
  var num = undefined;
  keys.forEach(function(e) {
    field = result[e];
    if (_neo4jDriver.v1.isInt(field)) {
      num = _neo4jDriver.v1.int(field);
      if (_neo4jDriver.v1.integer.inSafeRange(num)) {
        result[e] = num.toString();
      } else {
        result[e] = num.toString();
      }
    } else if ((0, _typeof3.default)(result[e]) === 'object') {
      return convertIntegerFields(result[e]);
    }
  });
  return result;
};

function computeSkipLimit(selection, variableValues) {
  var first = argumentValue(selection, 'first', variableValues);
  var offset = argumentValue(selection, 'offset', variableValues);

  if (first === null && offset === null) return '';
  if (offset === null) return '[..' + first + ']';
  if (first === null) return '[' + offset + '..]';
  return '[' + offset + '..' + (parseInt(offset) + parseInt(first)) + ']';
}

var computeOrderBy = (exports.computeOrderBy = function computeOrderBy(
  resolveInfo,
  selection
) {
  var orderByVar = argumentValue(
    resolveInfo.operation.selectionSet.selections[0],
    'orderBy',
    resolveInfo.variableValues
  );

  if (orderByVar == undefined) {
    return '';
  } else {
    var splitIndex = orderByVar.lastIndexOf('_');
    var order = orderByVar.substring(splitIndex + 1);
    var orderBy = orderByVar.substring(0, splitIndex);

    var _typeIdentifiers2 = typeIdentifiers(resolveInfo.returnType),
      variableName = _typeIdentifiers2.variableName;

    return (
      ' ORDER BY ' +
      variableName +
      '.' +
      orderBy +
      ' ' +
      (order === 'asc' ? 'ASC' : 'DESC') +
      ' '
    );
  }
});

var possiblySetFirstId = (exports.possiblySetFirstId = function possiblySetFirstId(
  _ref9
) {
  var args = _ref9.args,
    statements = _ref9.statements,
    params = _ref9.params;

  var arg = args.find(function(e) {
    return getFieldValueType(e) === 'ID';
  });
  // arg is the first ID field if it exists, and we set the value
  // if no value is provided for the field name (arg.name.value) in params
  if (arg && arg.name.value && params[arg.name.value] === undefined) {
    statements.push(arg.name.value + ': apoc.create.uuid()');
  }
  return statements;
});

var getQueryArguments = (exports.getQueryArguments = function getQueryArguments(
  resolveInfo
) {
  return resolveInfo.schema.getQueryType().getFields()[resolveInfo.fieldName]
    .astNode.arguments;
});

var getMutationArguments = (exports.getMutationArguments = function getMutationArguments(
  resolveInfo
) {
  return resolveInfo.schema.getMutationType().getFields()[resolveInfo.fieldName]
    .astNode.arguments;
});

var decideCypherFunction = function decideCypherFunction(fieldAst) {
  var cypherFunction = undefined;
  var type = fieldAst ? getNamedType(fieldAst.type).name.value : '';
  switch (type) {
    case '_Neo4jTimeInput':
      cypherFunction = 'time';
      break;
    case '_Neo4jDateInput':
      cypherFunction = 'date';
      break;
    case '_Neo4jDateTimeInput':
      cypherFunction = 'datetime';
      break;
    case '_Neo4jLocalTimeInput':
      cypherFunction = 'localtime';
      break;
    case '_Neo4jLocalDateTimeInput':
      cypherFunction = 'localdatetime';
      break;
    default:
      break;
  }
  return cypherFunction;
};

var buildCypherParameters = (exports.buildCypherParameters = function buildCypherParameters(
  _ref10
) {
  var args = _ref10.args,
    _ref10$statements = _ref10.statements,
    statements = _ref10$statements === undefined ? [] : _ref10$statements,
    params = _ref10.params,
    paramKey = _ref10.paramKey;

  var dataParams = paramKey ? params[paramKey] : params;
  var paramKeys = dataParams ? (0, _keys2.default)(dataParams) : [];
  if (args) {
    statements = paramKeys.reduce(function(acc, paramName) {
      var param = paramKey ? params[paramKey][paramName] : params[paramName];
      // The AST definition of the argument of the same name as this param
      var fieldAst = args.find(function(arg) {
        return arg.name.value === paramName;
      });
      if (fieldAst) {
        var formatted = param.formatted;
        var cypherFunction = decideCypherFunction(fieldAst);
        if (cypherFunction) {
          // Prefer only using formatted, if provided
          if (formatted) {
            if (paramKey) {
              params[paramKey][paramName] = formatted;
            } else {
              params[paramName] = formatted;
            }
            acc.push(
              paramName +
                ': ' +
                cypherFunction +
                '($' +
                (paramKey ? paramKey + '.' : '') +
                paramName +
                ')'
            );
          } else {
            // build all arguments for given cypherFunction
            acc.push(
              paramName +
                ': ' +
                cypherFunction +
                '({' +
                temporalFieldParam(paramName, param, paramKey) +
                '})'
            );
          }
        } else {
          // normal case
          acc.push(
            paramName + ':$' + (paramKey ? paramKey + '.' : '') + paramName
          );
        }
      }
      return acc;
    }, statements);
  }
  if (paramKey) {
    params[paramKey] = dataParams;
  }
  return [params, statements];
});

var temporalFieldParam = function temporalFieldParam(
  paramName,
  param,
  paramKey
) {
  return param.formatted === undefined
    ? (0, _keys2.default)(param)
        .reduce(function(acc, t) {
          if ((0, _isInteger2.default)(param[t])) {
            acc.push(
              t +
                ': toInteger($' +
                (paramKey ? paramKey + '.' : '') +
                paramName +
                '.' +
                t +
                ')'
            );
          } else {
            acc.push(
              t + ': $' + (paramKey ? paramKey + '.' : '') + paramName + '.' + t
            );
          }
          return acc;
        }, [])
        .join(',')
    : '';
};

function extractSelections(selections, fragments) {
  // extract any fragment selection sets into a single array of selections
  return selections.reduce(function(acc, cur) {
    if (cur.kind === 'FragmentSpread') {
      var recursivelyExtractedSelections = extractSelections(
        fragments[cur.name.value].selectionSet.selections,
        fragments
      );
      return [].concat(
        (0, _toConsumableArray3.default)(acc),
        (0, _toConsumableArray3.default)(recursivelyExtractedSelections)
      );
    } else {
      return [].concat((0, _toConsumableArray3.default)(acc), [cur]);
    }
  }, []);
}

function fixParamsForAddRelationshipMutation(params, resolveInfo) {
  // FIXME: find a better way to map param name in schema to datamodel
  var mutationMeta = void 0,
    fromTypeArg = void 0,
    toTypeArg = void 0;

  try {
    mutationMeta = resolveInfo.schema
      .getMutationType()
      .getFields()
      [resolveInfo.fieldName].astNode.directives.filter(function(x) {
        return x.name.value === 'MutationMeta';
      })[0];
  } catch (e) {
    throw new Error(
      'Missing required MutationMeta directive on add relationship directive'
    );
  }

  try {
    fromTypeArg = mutationMeta.arguments.filter(function(x) {
      return x.name.value === 'from';
    })[0];

    toTypeArg = mutationMeta.arguments.filter(function(x) {
      return x.name.value === 'to';
    })[0];
  } catch (e) {
    throw new Error(
      'Missing required argument in MutationMeta directive (relationship, from, or to)'
    );
  }
  //TODO: need to handle one-to-one and one-to-many

  var fromType = fromTypeArg.value.value,
    toType = toTypeArg.value.value,
    fromVar = lowFirstLetter(fromType),
    toVar = lowFirstLetter(toType),
    fromParam = resolveInfo.schema
      .getMutationType()
      .getFields()
      [resolveInfo.fieldName].astNode.arguments[0].name.value.substr(
        fromVar.length
      ),
    toParam = resolveInfo.schema
      .getMutationType()
      .getFields()
      [resolveInfo.fieldName].astNode.arguments[1].name.value.substr(
        toVar.length
      );

  params[toParam] =
    params[
      resolveInfo.schema.getMutationType().getFields()[
        resolveInfo.fieldName
      ].astNode.arguments[1].name.value
    ];

  params[fromParam] =
    params[
      resolveInfo.schema.getMutationType().getFields()[
        resolveInfo.fieldName
      ].astNode.arguments[0].name.value
    ];

  delete params[
    resolveInfo.schema.getMutationType().getFields()[resolveInfo.fieldName]
      .astNode.arguments[1].name.value
  ];

  delete params[
    resolveInfo.schema.getMutationType().getFields()[resolveInfo.fieldName]
      .astNode.arguments[0].name.value
  ];

  return params;
}

var isKind = (exports.isKind = function isKind(type, kind) {
  return type && type.kind === kind;
});

var isListType = (exports.isListType = function isListType(type) {
  var isList =
    arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

  if (!isKind(type, 'NamedType')) {
    if (isKind(type, 'ListType')) isList = true;
    return isListType(type.type, isList);
  }
  return isList;
});

var parameterizeRelationFields = (exports.parameterizeRelationFields = function parameterizeRelationFields(
  fields
) {
  var name = '';
  return (0, _keys2.default)(fields)
    .reduce(function(acc, t) {
      name = fields[t].name.value;
      acc.push(name + ':$data.' + name);
      return acc;
    }, [])
    .join(',');
});

var getRelationTypeDirectiveArgs = (exports.getRelationTypeDirectiveArgs = function getRelationTypeDirectiveArgs(
  relationshipType
) {
  var directive = relationshipType.directives.find(function(e) {
    return e.name.value === 'relation';
  });
  return directive
    ? {
        name: directive.arguments.find(function(e) {
          return e.name.value === 'name';
        }).value.value,
        from: directive.arguments.find(function(e) {
          return e.name.value === 'from';
        }).value.value,
        to: directive.arguments.find(function(e) {
          return e.name.value === 'to';
        }).value.value
      }
    : undefined;
});

var getFieldArgumentsFromAst = (exports.getFieldArgumentsFromAst = function getFieldArgumentsFromAst(
  field,
  typeName,
  fieldIsList
) {
  var fieldArgs = field.arguments ? field.arguments : [];
  var augmentedArgs = [].concat((0, _toConsumableArray3.default)(fieldArgs));
  if (fieldIsList) {
    augmentedArgs = (0, _augment.possiblyAddArgument)(
      augmentedArgs,
      'first',
      'Int'
    );
    augmentedArgs = (0, _augment.possiblyAddArgument)(
      augmentedArgs,
      'offset',
      'Int'
    );
    augmentedArgs = (0, _augment.possiblyAddArgument)(
      augmentedArgs,
      'orderBy',
      '_' + typeName + 'Ordering'
    );
  }
  var args = augmentedArgs
    .reduce(function(acc, t) {
      acc.push((0, _graphql.print)(t));
      return acc;
    }, [])
    .join('\n');
  return args.length > 0 ? '(' + args + ')' : '';
});

var getRelationMutationPayloadFieldsFromAst = (exports.getRelationMutationPayloadFieldsFromAst = function getRelationMutationPayloadFieldsFromAst(
  relatedAstNode
) {
  var isList = false;
  var fieldName = '';
  return relatedAstNode.fields
    .reduce(function(acc, t) {
      fieldName = t.name.value;
      if (fieldName !== 'to' && fieldName !== 'from') {
        isList = isListType(t);
        // Use name directly in order to prevent requiring required fields on the payload type
        acc.push(
          fieldName +
            ': ' +
            (isList ? '[' : '') +
            getNamedType(t).name.value +
            (isList ? ']' : '') +
            (0, _graphql.print)(t.directives)
        );
      }
      return acc;
    }, [])
    .join('\n');
});

var getFieldValueType = (exports.getFieldValueType = function getFieldValueType(
  type
) {
  if (type.kind !== 'NamedType') {
    return getFieldValueType(type.type);
  }
  return type.name.value;
});

var getNamedType = (exports.getNamedType = function getNamedType(type) {
  if (type.kind !== 'NamedType') {
    return getNamedType(type.type);
  }
  return type;
});

var isBasicScalar = (exports.isBasicScalar = function isBasicScalar(name) {
  return (
    name === 'ID' ||
    name === 'String' ||
    name === 'Float' ||
    name === 'Int' ||
    name === 'Boolean'
  );
});

var firstNonNullAndIdField = function firstNonNullAndIdField(fields) {
  var valueTypeName = '';
  return fields.find(function(e) {
    valueTypeName = getNamedType(e).name.value;
    return (
      e.name.value !== '_id' &&
      e.type.kind === 'NonNullType' &&
      valueTypeName === 'ID'
    );
  });
};

var firstIdField = function firstIdField(fields) {
  var valueTypeName = '';
  return fields.find(function(e) {
    valueTypeName = getNamedType(e).name.value;
    return e.name.value !== '_id' && valueTypeName === 'ID';
  });
};

var firstNonNullField = function firstNonNullField(fields) {
  var valueTypeName = '';
  return fields.find(function(e) {
    valueTypeName = getNamedType(e).name.value;
    return valueTypeName === 'NonNullType';
  });
};

var firstField = function firstField(fields) {
  return fields.find(function(e) {
    return e.name.value !== '_id';
  });
};

var getPrimaryKey = (exports.getPrimaryKey = function getPrimaryKey(astNode) {
  var fields = astNode.fields;
  var pk = firstNonNullAndIdField(fields);
  if (!pk) {
    pk = firstIdField(fields);
  }
  if (!pk) {
    pk = firstNonNullField(fields);
  }
  if (!pk) {
    pk = firstField(fields);
  }
  return pk;
});

var getTypeDirective = (exports.getTypeDirective = function getTypeDirective(
  relatedAstNode,
  name
) {
  return relatedAstNode.directives
    ? relatedAstNode.directives.find(function(e) {
        return e.name.value === name;
      })
    : undefined;
});

var getFieldDirective = (exports.getFieldDirective = function getFieldDirective(
  field,
  directive
) {
  return (
    field &&
    field.directives.find(function(e) {
      return e.name.value === directive;
    })
  );
});

var isNonNullType = (exports.isNonNullType = function isNonNullType(type) {
  var isRequired =
    arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  var parent =
    arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  if (!isKind(type, 'NamedType')) {
    return isNonNullType(type.type, isRequired, type);
  }
  if (isKind(parent, 'NonNullType')) {
    isRequired = true;
  }
  return isRequired;
});

var createOperationMap = (exports.createOperationMap = function createOperationMap(
  type
) {
  var fields = type ? type.fields : [];
  return fields.reduce(function(acc, t) {
    acc[t.name.value] = t;
    return acc;
  }, {});
});

var isNodeType = (exports.isNodeType = function isNodeType(astNode) {
  // TODO: check for @ignore and @model directives
  return (
    astNode &&
    // must be graphql object type
    astNode.kind === 'ObjectTypeDefinition' &&
    // is not Query or Mutation type
    astNode.name.value !== 'Query' &&
    astNode.name.value !== 'Mutation' &&
    // does not have relation type directive
    getTypeDirective(astNode, 'relation') === undefined &&
    // does not have from and to fields; not relation type
    astNode.fields &&
    astNode.fields.find(function(e) {
      return e.name.value === 'from';
    }) === undefined &&
    astNode.fields.find(function(e) {
      return e.name.value === 'to';
    }) === undefined
  );
});

var parseFieldSdl = (exports.parseFieldSdl = function parseFieldSdl(sdl) {
  return sdl
    ? (0, _graphql.parse)('type fieldToParse { ' + sdl + ' }').definitions[0]
        .fields[0]
    : {};
});

var getRelationDirection = (exports.getRelationDirection = function getRelationDirection(
  relationDirective
) {
  var direction = {};
  try {
    direction = relationDirective.arguments.filter(function(a) {
      return a.name.value === 'direction';
    })[0];
    return direction.value.value;
  } catch (e) {
    // FIXME: should we ignore this error to define default behavior?
    throw new Error('No direction argument specified on @relation directive');
  }
});

var getRelationName = (exports.getRelationName = function getRelationName(
  relationDirective
) {
  var name = {};
  try {
    name = relationDirective.arguments.filter(function(a) {
      return a.name.value === 'name';
    })[0];
    return name.value.value;
  } catch (e) {
    // FIXME: should we ignore this error to define default behavior?
    throw new Error('No name argument specified on @relation directive');
  }
});

/**
 * Render safe a variable name according to cypher rules
 * @param {String} i input variable name
 * @returns {String} escaped text suitable for interpolation in cypher
 */
var safeVar = (exports.safeVar = function safeVar(i) {
  // There are rare cases where the var input is an object and has to be stringified
  // to produce the right output.
  var asStr = '' + i;

  // Rules: https://neo4j.com/docs/developer-manual/current/cypher/syntax/naming/
  return '`' + asStr.replace(/[-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]/g, '_') + '`';
});

/**
 * Render safe a label name by enclosing it in backticks and escaping any
 * existing backtick if present.
 * @param {String} l a label name
 * @returns {String} an escaped label name suitable for cypher concat
 */
var safeLabel = (exports.safeLabel = function safeLabel(l) {
  var asStr = '' + l;
  var escapeInner = asStr.replace(/\`/g, '\\`');
  return '`' + escapeInner + '`';
});

var printTypeMap = (exports.printTypeMap = function printTypeMap(typeMap) {
  return (0, _graphql.print)({
    kind: 'Document',
    definitions: (0, _values2.default)(typeMap)
  });
});

var decideNestedVariableName = (exports.decideNestedVariableName = function decideNestedVariableName(
  _ref11
) {
  var schemaTypeRelation = _ref11.schemaTypeRelation,
    innerSchemaTypeRelation = _ref11.innerSchemaTypeRelation,
    variableName = _ref11.variableName,
    fieldName = _ref11.fieldName,
    rootVariableNames = _ref11.rootVariableNames;

  if (rootVariableNames) {
    // Only show up for relation mutations
    return rootVariableNames[fieldName];
  }
  if (schemaTypeRelation) {
    var fromTypeName = schemaTypeRelation.from;
    var toTypeName = schemaTypeRelation.to;
    if (fromTypeName === toTypeName) {
      if (fieldName === 'from' || fieldName === 'to') {
        return variableName + '_' + fieldName;
      } else {
        // Case of a reflexive relationship type's directed field
        // being renamed to its node type value
        // ex: from: User -> User: User
        return variableName;
      }
    }
  } else {
    // Types without @relation directives are assumed to be node types
    // and only node types can have fields whose values are relation types
    if (innerSchemaTypeRelation) {
      // innerSchemaType is a field payload type using a @relation directive
      if (innerSchemaTypeRelation.from === innerSchemaTypeRelation.to) {
        return variableName;
      }
    } else {
      // related types are different
      return variableName + '_' + fieldName;
    }
  }
  return variableName + '_' + fieldName;
});

var extractTypeMapFromTypeDefs = (exports.extractTypeMapFromTypeDefs = function extractTypeMapFromTypeDefs(
  typeDefs
) {
  // TODO: accept alternative typeDefs formats (arr of strings, ast, etc.)
  // into a single string for parse, add validatation
  var astNodes = (0, _graphql.parse)(typeDefs).definitions;
  return astNodes.reduce(function(acc, t) {
    if (t.name) acc[t.name.value] = t;
    return acc;
  }, {});
});

var addDirectiveDeclarations = (exports.addDirectiveDeclarations = function addDirectiveDeclarations(
  typeMap
) {
  // overwrites any provided directive declarations for system directive names
  typeMap['cypher'] = (0, _graphql.parse)(
    'directive @cypher(statement: String) on FIELD_DEFINITION'
  );
  typeMap['relation'] = (0, _graphql.parse)(
    'directive @relation(name: String, direction: _RelationDirections, from: String, to: String) on FIELD_DEFINITION | OBJECT'
  );
  typeMap['MutationMeta'] = (0, _graphql.parse)(
    'directive @MutationMeta(relationship: String, from: String, to: String) on FIELD_DEFINITION'
  );
  typeMap['_RelationDirections'] = (0, _graphql.parse)(
    'enum _RelationDirections { IN OUT }'
  );
  return typeMap;
});

var initializeMutationParams = (exports.initializeMutationParams = function initializeMutationParams(
  _ref12
) {
  var resolveInfo = _ref12.resolveInfo,
    mutationTypeCypherDirective = _ref12.mutationTypeCypherDirective,
    otherParams = _ref12.otherParams,
    first = _ref12.first,
    offset = _ref12.offset;

  return (isCreateMutation(resolveInfo) || isUpdateMutation(resolveInfo)) &&
    !mutationTypeCypherDirective
    ? (0, _extends3.default)(
        { params: otherParams },
        { first: first, offset: offset }
      )
    : (0, _extends3.default)({}, otherParams, { first: first, offset: offset });
});

var getQueryCypherDirective = (exports.getQueryCypherDirective = function getQueryCypherDirective(
  resolveInfo
) {
  return resolveInfo.schema
    .getQueryType()
    .getFields()
    [resolveInfo.fieldName].astNode.directives.find(function(x) {
      return x.name.value === 'cypher';
    });
});

var getMutationCypherDirective = (exports.getMutationCypherDirective = function getMutationCypherDirective(
  resolveInfo
) {
  return resolveInfo.schema
    .getMutationType()
    .getFields()
    [resolveInfo.fieldName].astNode.directives.find(function(x) {
      return x.name.value === 'cypher';
    });
});

var getOuterSkipLimit = (exports.getOuterSkipLimit = function getOuterSkipLimit(
  first
) {
  return 'SKIP $offset' + (first > -1 ? ' LIMIT $first' : '');
});

var getQuerySelections = (exports.getQuerySelections = function getQuerySelections(
  resolveInfo
) {
  var filteredFieldNodes = (0, _filter2.default)(
    resolveInfo.fieldNodes,
    function(n) {
      return n.name.value === resolveInfo.fieldName;
    }
  );
  // FIXME: how to handle multiple fieldNode matches
  return extractSelections(
    filteredFieldNodes[0].selectionSet.selections,
    resolveInfo.fragments
  );
});

var getMutationSelections = (exports.getMutationSelections = function getMutationSelections(
  resolveInfo
) {
  var selections = getQuerySelections(resolveInfo);
  if (selections.length === 0) {
    // FIXME: why aren't the selections found in the filteredFieldNode?
    selections = extractSelections(
      resolveInfo.operation.selectionSet.selections,
      resolveInfo.fragments
    );
  }
  return selections;
});

var filterNullParams = (exports.filterNullParams = function filterNullParams(
  _ref13
) {
  var offset = _ref13.offset,
    first = _ref13.first,
    otherParams = _ref13.otherParams;

  return (0, _entries2.default)(
    (0, _extends3.default)({ offset: offset, first: first }, otherParams)
  ).reduce(
    function(_ref14, _ref15) {
      var _ref17 = (0, _slicedToArray3.default)(_ref14, 2),
        nulls = _ref17[0],
        nonNulls = _ref17[1];

      var _ref16 = (0, _slicedToArray3.default)(_ref15, 2),
        key = _ref16[0],
        value = _ref16[1];

      if (value === null) {
        nulls[key] = value;
      } else {
        nonNulls[key] = value;
      }
      return [nulls, nonNulls];
    },
    [{}, {}]
  );
});

var isTemporalType = (exports.isTemporalType = function isTemporalType(name) {
  return (
    name === '_Neo4jTime' ||
    name === '_Neo4jDate' ||
    name === '_Neo4jDateTime' ||
    name === '_Neo4jLocalTime' ||
    name === '_Neo4jLocalDateTime'
  );
});

var isTemporalInputType = function isTemporalInputType(name) {
  return (
    name === '_Neo4jTimeInput' ||
    name === '_Neo4jDateInput' ||
    name === '_Neo4jDateTimeInput' ||
    name === '_Neo4jLocalTimeInput' ||
    name === '_Neo4jLocalDateTimeInput'
  );
};

var isTemporalField = (exports.isTemporalField = function isTemporalField(
  schemaType,
  name
) {
  var type = schemaType ? schemaType.name : '';
  return (
    (isTemporalType(type) && name === 'year') ||
    name === 'month' ||
    name === 'day' ||
    name === 'hour' ||
    name === 'minute' ||
    name === 'second' ||
    name === 'microsecond' ||
    name === 'millisecond' ||
    name === 'nanosecond' ||
    name === 'timezone' ||
    name === 'formatted'
  );
});

var getTemporalArguments = (exports.getTemporalArguments = function getTemporalArguments(
  args
) {
  return args
    ? args.reduce(function(acc, t) {
        var fieldType = getNamedType(t.type).name.value;
        if (isTemporalInputType(fieldType)) acc.push(t);
        return acc;
      }, [])
    : [];
});

function temporalPredicateClauses(
  filters,
  variableName,
  temporalArgs,
  parentParam
) {
  return temporalArgs.reduce(function(acc, t) {
    // For every temporal argument
    var argName = t.name.value;
    var temporalParam = filters[argName];
    if (temporalParam) {
      // If a parameter value has been provided for it check whether
      // the provided param value is in an indexed object for a nested argument
      var paramIndex = temporalParam.index;
      var paramValue = temporalParam.value;
      // If it is, set and use its .value
      if (paramValue) temporalParam = paramValue;
      if (temporalParam['formatted']) {
        // Only the dedicated 'formatted' arg is used if it is provided
        var cypherFunction = decideCypherFunction(t);
        acc.push(
          variableName +
            '.' +
            argName +
            ' = ' +
            cypherFunction +
            '($' +
            // use index if provided, for nested arguments
            (typeof paramIndex === 'undefined'
              ? '' +
                (parentParam ? parentParam + '.' : '') +
                argName +
                '.formatted'
              : '' +
                (parentParam ? parentParam + '.' : '') +
                paramIndex +
                '_' +
                argName +
                '.formatted') +
            ')'
        );
      } else {
        (0, _keys2.default)(temporalParam).forEach(function(e) {
          acc.push(
            variableName +
              '.' +
              argName +
              '.' +
              e +
              ' = $' +
              (typeof paramIndex === 'undefined'
                ? '' + (parentParam ? parentParam + '.' : '') + argName
                : '' +
                  (parentParam ? parentParam + '.' : '') +
                  paramIndex +
                  '_' +
                  argName) +
              '.' +
              e
          );
        });
      }
    }
    return acc;
  }, []);
}
