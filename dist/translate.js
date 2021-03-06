'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.translateMutation = exports.translateQuery = exports.temporalType = exports.temporalField = exports.nodeTypeFieldOnRelationType = exports.relationTypeFieldOnNodeType = exports.relationFieldOnNodeType = exports.customCypherField = undefined;

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _utils = require('./utils');

var _graphql = require('graphql');

var _selections = require('./selections');

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

var customCypherField = (exports.customCypherField = function customCypherField(
  _ref
) {
  var customCypher = _ref.customCypher,
    schemaTypeRelation = _ref.schemaTypeRelation,
    initial = _ref.initial,
    fieldName = _ref.fieldName,
    fieldType = _ref.fieldType,
    nestedVariable = _ref.nestedVariable,
    variableName = _ref.variableName,
    headSelection = _ref.headSelection,
    schemaType = _ref.schemaType,
    resolveInfo = _ref.resolveInfo,
    subSelection = _ref.subSelection,
    skipLimit = _ref.skipLimit,
    commaIfTail = _ref.commaIfTail,
    tailParams = _ref.tailParams;

  if (schemaTypeRelation) {
    variableName = variableName + '_relation';
  }
  var fieldIsList = !!fieldType.ofType;
  // similar: [ x IN apoc.cypher.runFirstColumn("WITH {this} AS this MATCH (this)--(:Genre)--(o:Movie) RETURN o", {this: movie}, true) |x {.title}][1..2])
  return (0, _extends3.default)(
    {
      initial:
        '' +
        initial +
        fieldName +
        ': ' +
        (fieldIsList ? '' : 'head(') +
        '[ ' +
        nestedVariable +
        ' IN apoc.cypher.runFirstColumn("' +
        customCypher +
        '", ' +
        (0, _utils.cypherDirectiveArgs)(
          variableName,
          headSelection,
          schemaType,
          resolveInfo
        ) +
        ', true) | ' +
        nestedVariable +
        ' {' +
        subSelection[0] +
        '}]' +
        (fieldIsList ? '' : ')') +
        skipLimit +
        ' ' +
        commaIfTail
    },
    tailParams
  );
});

var relationFieldOnNodeType = (exports.relationFieldOnNodeType = function relationFieldOnNodeType(
  _ref2
) {
  var initial = _ref2.initial,
    fieldName = _ref2.fieldName,
    fieldType = _ref2.fieldType,
    variableName = _ref2.variableName,
    relDirection = _ref2.relDirection,
    relType = _ref2.relType,
    nestedVariable = _ref2.nestedVariable,
    isInlineFragment = _ref2.isInlineFragment,
    interfaceLabel = _ref2.interfaceLabel,
    innerSchemaType = _ref2.innerSchemaType,
    queryParams = _ref2.queryParams,
    subSelection = _ref2.subSelection,
    skipLimit = _ref2.skipLimit,
    commaIfTail = _ref2.commaIfTail,
    tailParams = _ref2.tailParams;

  return (0, _extends3.default)(
    {
      initial:
        '' +
        initial +
        fieldName +
        ': ' +
        (!(0, _utils.isArrayType)(fieldType) ? 'head(' : '') +
        '[(' +
        (0, _utils.safeVar)(variableName) +
        ')' +
        (relDirection === 'in' || relDirection === 'IN' ? '<' : '') +
        '-[:' +
        (0, _utils.safeLabel)(relType) +
        ']-' +
        (relDirection === 'out' || relDirection === 'OUT' ? '>' : '') +
        '(' +
        (0, _utils.safeVar)(nestedVariable) +
        ':' +
        (0, _utils.safeLabel)(
          isInlineFragment ? interfaceLabel : innerSchemaType.name
        ) +
        queryParams +
        ') | ' +
        nestedVariable +
        ' {' +
        (isInlineFragment
          ? 'FRAGMENT_TYPE: "' + interfaceLabel + '",' + subSelection[0]
          : subSelection[0]) +
        '}]' +
        (!(0, _utils.isArrayType)(fieldType) ? ')' : '') +
        skipLimit +
        ' ' +
        commaIfTail
    },
    tailParams
  );
});

var relationTypeFieldOnNodeType = (exports.relationTypeFieldOnNodeType = function relationTypeFieldOnNodeType(
  _ref3
) {
  var innerSchemaTypeRelation = _ref3.innerSchemaTypeRelation,
    initial = _ref3.initial,
    fieldName = _ref3.fieldName,
    subSelection = _ref3.subSelection,
    skipLimit = _ref3.skipLimit,
    commaIfTail = _ref3.commaIfTail,
    tailParams = _ref3.tailParams,
    fieldType = _ref3.fieldType,
    variableName = _ref3.variableName,
    schemaType = _ref3.schemaType,
    nestedVariable = _ref3.nestedVariable,
    queryParams = _ref3.queryParams;

  if (innerSchemaTypeRelation.from === innerSchemaTypeRelation.to) {
    return (0, _extends3.default)(
      {
        initial:
          '' +
          initial +
          fieldName +
          ': {' +
          subSelection[0] +
          '}' +
          skipLimit +
          ' ' +
          commaIfTail
      },
      tailParams
    );
  }
  return (0, _extends3.default)(
    {
      initial:
        '' +
        initial +
        fieldName +
        ': ' +
        (!(0, _utils.isArrayType)(fieldType) ? 'head(' : '') +
        '[(' +
        (0, _utils.safeVar)(variableName) +
        ')' +
        (schemaType.name === innerSchemaTypeRelation.to ? '<' : '') +
        '-[' +
        (0, _utils.safeVar)(nestedVariable + '_relation') +
        ':' +
        (0, _utils.safeLabel)(innerSchemaTypeRelation.name) +
        queryParams +
        ']-' +
        (schemaType.name === innerSchemaTypeRelation.from ? '>' : '') +
        '(:' +
        (0, _utils.safeLabel)(
          schemaType.name === innerSchemaTypeRelation.from
            ? innerSchemaTypeRelation.to
            : innerSchemaTypeRelation.from
        ) +
        ') | ' +
        nestedVariable +
        '_relation {' +
        subSelection[0] +
        '}]' +
        (!(0, _utils.isArrayType)(fieldType) ? ')' : '') +
        skipLimit +
        ' ' +
        commaIfTail
    },
    tailParams
  );
});

var nodeTypeFieldOnRelationType = (exports.nodeTypeFieldOnRelationType = function nodeTypeFieldOnRelationType(
  _ref4
) {
  var fieldInfo = _ref4.fieldInfo,
    rootVariableNames = _ref4.rootVariableNames,
    schemaTypeRelation = _ref4.schemaTypeRelation,
    innerSchemaType = _ref4.innerSchemaType,
    isInlineFragment = _ref4.isInlineFragment,
    interfaceLabel = _ref4.interfaceLabel;

  if (rootVariableNames) {
    // Special case used by relation mutation payloads
    // rootVariableNames is persisted for sibling directed fields
    return relationTypeMutationPayloadField(
      (0, _extends3.default)({}, fieldInfo, {
        rootVariableNames: rootVariableNames
      })
    );
  } else {
    // Normal case of schemaType with a relationship directive
    return directedFieldOnReflexiveRelationType(
      (0, _extends3.default)({}, fieldInfo, {
        schemaTypeRelation: schemaTypeRelation,
        innerSchemaType: innerSchemaType,
        isInlineFragment: isInlineFragment,
        interfaceLabel: interfaceLabel
      })
    );
  }
});

var relationTypeMutationPayloadField = function relationTypeMutationPayloadField(
  _ref5
) {
  var initial = _ref5.initial,
    fieldName = _ref5.fieldName,
    variableName = _ref5.variableName,
    subSelection = _ref5.subSelection,
    skipLimit = _ref5.skipLimit,
    commaIfTail = _ref5.commaIfTail,
    tailParams = _ref5.tailParams,
    rootVariableNames = _ref5.rootVariableNames;

  var safeVariableName = (0, _utils.safeVar)(variableName);
  return (0, _extends3.default)(
    {
      initial:
        '' +
        initial +
        fieldName +
        ': ' +
        safeVariableName +
        ' {' +
        subSelection[0] +
        '}' +
        skipLimit +
        ' ' +
        commaIfTail
    },
    tailParams,
    {
      rootVariableNames: rootVariableNames,
      variableName:
        fieldName === 'from' ? rootVariableNames.to : rootVariableNames.from
    }
  );
};

var directedFieldOnReflexiveRelationType = function directedFieldOnReflexiveRelationType(
  _ref6
) {
  var initial = _ref6.initial,
    fieldName = _ref6.fieldName,
    fieldType = _ref6.fieldType,
    variableName = _ref6.variableName,
    queryParams = _ref6.queryParams,
    nestedVariable = _ref6.nestedVariable,
    subSelection = _ref6.subSelection,
    skipLimit = _ref6.skipLimit,
    commaIfTail = _ref6.commaIfTail,
    tailParams = _ref6.tailParams,
    schemaTypeRelation = _ref6.schemaTypeRelation,
    innerSchemaType = _ref6.innerSchemaType,
    isInlineFragment = _ref6.isInlineFragment,
    interfaceLabel = _ref6.interfaceLabel;

  var relType = schemaTypeRelation.name;
  var fromTypeName = schemaTypeRelation.from;
  var toTypeName = schemaTypeRelation.to;
  var isFromField = fieldName === fromTypeName || fieldName === 'from';
  var isToField = fieldName === toTypeName || fieldName === 'to';
  var relationshipVariableName =
    variableName + '_' + (isFromField ? 'from' : 'to') + '_relation';
  // Since the translations are significantly different,
  // we first check whether the relationship is reflexive
  if (fromTypeName === toTypeName) {
    if (fieldName === 'from' || fieldName === 'to') {
      return (0, _extends3.default)(
        {
          initial:
            '' +
            initial +
            fieldName +
            ': ' +
            (!(0, _utils.isArrayType)(fieldType) ? 'head(' : '') +
            '[(' +
            (0, _utils.safeVar)(variableName) +
            ')' +
            (isFromField ? '<' : '') +
            '-[' +
            (0, _utils.safeVar)(relationshipVariableName) +
            ':' +
            (0, _utils.safeLabel)(relType) +
            queryParams +
            ']-' +
            (isToField ? '>' : '') +
            '(' +
            (0, _utils.safeVar)(nestedVariable) +
            ':' +
            (0, _utils.safeLabel)(
              isInlineFragment ? interfaceLabel : fromTypeName
            ) +
            ') | ' +
            relationshipVariableName +
            ' {' +
            (isInlineFragment
              ? 'FRAGMENT_TYPE: "' + interfaceLabel + '",' + subSelection[0]
              : subSelection[0]) +
            '}]' +
            (!(0, _utils.isArrayType)(fieldType) ? ')' : '') +
            skipLimit +
            ' ' +
            commaIfTail
        },
        tailParams
      );
    } else {
      // Case of a renamed directed field
      return (0, _extends3.default)(
        {
          initial:
            '' +
            initial +
            fieldName +
            ': ' +
            variableName +
            ' {' +
            subSelection[0] +
            '}' +
            skipLimit +
            ' ' +
            commaIfTail
        },
        tailParams
      );
    }
  }
  // Related node types are different
  return (0, _extends3.default)(
    {
      initial:
        '' +
        initial +
        fieldName +
        ': ' +
        (!(0, _utils.isArrayType)(fieldType) ? 'head(' : '') +
        '[(:' +
        (0, _utils.safeLabel)(isFromField ? toTypeName : fromTypeName) +
        ')' +
        (isFromField ? '<' : '') +
        '-[' +
        (0, _utils.safeVar)(variableName + '_relation') +
        ']-' +
        (isToField ? '>' : '') +
        '(' +
        (0, _utils.safeVar)(nestedVariable) +
        ':' +
        (0, _utils.safeLabel)(
          isInlineFragment ? interfaceLabel : innerSchemaType.name
        ) +
        queryParams +
        ') | ' +
        nestedVariable +
        ' {' +
        (isInlineFragment
          ? 'FRAGMENT_TYPE: "' + interfaceLabel + '",' + subSelection[0]
          : subSelection[0]) +
        '}]' +
        (!(0, _utils.isArrayType)(fieldType) ? ')' : '') +
        skipLimit +
        ' ' +
        commaIfTail
    },
    tailParams
  );
};

var temporalField = (exports.temporalField = function temporalField(_ref7) {
  var initial = _ref7.initial,
    fieldName = _ref7.fieldName,
    commaIfTail = _ref7.commaIfTail,
    parentSchemaType = _ref7.parentSchemaType,
    parentFieldName = _ref7.parentFieldName,
    parentVariableName = _ref7.parentVariableName,
    tailParams = _ref7.tailParams;

  return (0, _extends3.default)(
    {
      initial:
        initial +
        ' ' +
        fieldName +
        ': ' +
        (fieldName === 'formatted'
          ? 'toString(' +
            (0, _utils.safeVar)(parentVariableName) +
            '.' +
            parentFieldName +
            ') ' +
            commaIfTail
          : (0, _utils.safeVar)(parentVariableName) +
            '.' +
            parentFieldName +
            '.' +
            fieldName +
            ' ' +
            commaIfTail),
      parentSchemaType: parentSchemaType,
      parentFieldName: parentFieldName,
      parentVariableName: parentVariableName
    },
    tailParams
  );
});

var temporalType = (exports.temporalType = function temporalType(_ref8) {
  var initial = _ref8.initial,
    fieldName = _ref8.fieldName,
    subSelection = _ref8.subSelection,
    commaIfTail = _ref8.commaIfTail,
    tailParams = _ref8.tailParams,
    traversalHistory = _ref8.traversalHistory;

  return (0, _extends3.default)(
    {
      initial:
        '' + initial + fieldName + ': {' + subSelection[0] + '}' + commaIfTail
    },
    tailParams,
    {
      traversalHistory: traversalHistory
    }
  );
});

// Query API root operation branch
var translateQuery = (exports.translateQuery = function translateQuery(_ref9) {
  var resolveInfo = _ref9.resolveInfo,
    selections = _ref9.selections,
    variableName = _ref9.variableName,
    typeName = _ref9.typeName,
    schemaType = _ref9.schemaType,
    first = _ref9.first,
    offset = _ref9.offset,
    _id = _ref9._id,
    orderBy = _ref9.orderBy,
    otherParams = _ref9.otherParams;

  var _filterNullParams = (0, _utils.filterNullParams)({
      offset: offset,
      first: first,
      otherParams: otherParams
    }),
    _filterNullParams2 = (0, _slicedToArray3.default)(_filterNullParams, 2),
    nullParams = _filterNullParams2[0],
    nonNullParams = _filterNullParams2[1];

  var filterParams = (0, _utils.getFilterParams)(nonNullParams);
  var queryArgs = (0, _utils.getQueryArguments)(resolveInfo);
  var temporalArgs = (0, _utils.getTemporalArguments)(queryArgs);
  var queryParams = (0, _utils.innerFilterParams)(filterParams, temporalArgs);
  var temporalClauses = (0, _utils.temporalPredicateClauses)(
    filterParams,
    variableName,
    temporalArgs
  );
  var outerSkipLimit = (0, _utils.getOuterSkipLimit)(first);
  var orderByValue = (0, _utils.computeOrderBy)(resolveInfo, selections);

  var queryTypeCypherDirective = (0, _utils.getQueryCypherDirective)(
    resolveInfo
  );
  if (queryTypeCypherDirective) {
    return customQuery({
      resolveInfo: resolveInfo,
      schemaType: schemaType,
      argString: queryParams,
      selections: selections,
      variableName: variableName,
      typeName: typeName,
      orderByValue: orderByValue,
      outerSkipLimit: outerSkipLimit,
      queryTypeCypherDirective: queryTypeCypherDirective,
      nonNullParams: nonNullParams
    });
  } else {
    return nodeQuery({
      resolveInfo: resolveInfo,
      schemaType: schemaType,
      argString: queryParams,
      selections: selections,
      variableName: variableName,
      typeName: typeName,
      temporalClauses: temporalClauses,
      orderByValue: orderByValue,
      outerSkipLimit: outerSkipLimit,
      nullParams: nullParams,
      nonNullParams: nonNullParams,
      _id: _id
    });
  }
});

// Custom read operation
var customQuery = function customQuery(_ref10) {
  var resolveInfo = _ref10.resolveInfo,
    schemaType = _ref10.schemaType,
    argString = _ref10.argString,
    selections = _ref10.selections,
    variableName = _ref10.variableName,
    typeName = _ref10.typeName,
    orderByValue = _ref10.orderByValue,
    outerSkipLimit = _ref10.outerSkipLimit,
    queryTypeCypherDirective = _ref10.queryTypeCypherDirective,
    nonNullParams = _ref10.nonNullParams;

  var safeVariableName = (0, _utils.safeVar)(variableName);

  var _buildCypherSelection = (0, _selections.buildCypherSelection)({
      initial: '',
      selections: selections,
      variableName: variableName,
      schemaType: schemaType,
      resolveInfo: resolveInfo,
      paramIndex: 1
    }),
    _buildCypherSelection2 = (0, _slicedToArray3.default)(
      _buildCypherSelection,
      2
    ),
    subQuery = _buildCypherSelection2[0],
    subParams = _buildCypherSelection2[1];

  var params = (0, _extends3.default)({}, nonNullParams, subParams);
  // QueryType with a @cypher directive
  var cypherQueryArg = queryTypeCypherDirective.arguments.find(function(x) {
    return x.name.value === 'statement';
  });
  var query =
    'WITH apoc.cypher.runFirstColumn("' +
    cypherQueryArg.value.value +
    '", ' +
    argString +
    ', True) AS x UNWIND x AS ' +
    safeVariableName +
    '\n    RETURN ' +
    safeVariableName +
    ' {' +
    subQuery +
    '} AS ' +
    safeVariableName +
    orderByValue +
    ' ' +
    outerSkipLimit;
  return [query, params];
};

// Generated API
var nodeQuery = function nodeQuery(_ref11) {
  var resolveInfo = _ref11.resolveInfo,
    schemaType = _ref11.schemaType,
    argString = _ref11.argString,
    selections = _ref11.selections,
    variableName = _ref11.variableName,
    typeName = _ref11.typeName,
    temporalClauses = _ref11.temporalClauses,
    orderByValue = _ref11.orderByValue,
    outerSkipLimit = _ref11.outerSkipLimit,
    nullParams = _ref11.nullParams,
    nonNullParams = _ref11.nonNullParams,
    _id = _ref11._id;

  var safeVariableName = (0, _utils.safeVar)(variableName);
  var safeLabelName = (0, _utils.safeLabel)(typeName);

  var _buildCypherSelection3 = (0, _selections.buildCypherSelection)({
      initial: '',
      selections: selections,
      variableName: variableName,
      schemaType: schemaType,
      resolveInfo: resolveInfo,
      paramIndex: 1
    }),
    _buildCypherSelection4 = (0, _slicedToArray3.default)(
      _buildCypherSelection3,
      2
    ),
    subQuery = _buildCypherSelection4[0],
    subParams = _buildCypherSelection4[1];

  var params = (0, _extends3.default)({}, nonNullParams, subParams);
  // FIXME: support IN for multiple values -> WHERE
  var idWherePredicate =
    typeof _id !== 'undefined' ? 'ID(' + safeVariableName + ')=' + _id : '';
  var nullFieldPredicates = (0, _keys2.default)(nullParams).map(function(key) {
    return variableName + '.' + key + ' IS NULL';
  });
  var predicateClauses = [idWherePredicate]
    .concat(
      (0, _toConsumableArray3.default)(nullFieldPredicates),
      (0, _toConsumableArray3.default)(temporalClauses)
    )
    .filter(function(predicate) {
      return !!predicate;
    })
    .join(' AND ');
  var predicate = predicateClauses ? 'WHERE ' + predicateClauses + ' ' : '';
  var query =
    'MATCH (' +
    safeVariableName +
    ':' +
    safeLabelName +
    ' ' +
    argString +
    ') ' +
    predicate +
    ('RETURN ' +
      safeVariableName +
      ' {' +
      subQuery +
      '} AS ' +
      safeVariableName +
      orderByValue +
      ' ' +
      outerSkipLimit);
  return [query, params];
};

// Mutation API root operation branch
var translateMutation = (exports.translateMutation = function translateMutation(
  _ref12
) {
  var resolveInfo = _ref12.resolveInfo,
    schemaType = _ref12.schemaType,
    selections = _ref12.selections,
    variableName = _ref12.variableName,
    typeName = _ref12.typeName,
    first = _ref12.first,
    offset = _ref12.offset,
    otherParams = _ref12.otherParams;

  var outerSkipLimit = (0, _utils.getOuterSkipLimit)(first);
  var orderByValue = (0, _utils.computeOrderBy)(resolveInfo, selections);
  var mutationTypeCypherDirective = (0, _utils.getMutationCypherDirective)(
    resolveInfo
  );
  var params = (0, _utils.initializeMutationParams)({
    resolveInfo: resolveInfo,
    mutationTypeCypherDirective: mutationTypeCypherDirective,
    first: first,
    otherParams: otherParams,
    offset: offset
  });
  var mutationInfo = {
    params: params,
    selections: selections,
    schemaType: schemaType,
    resolveInfo: resolveInfo
  };
  if (mutationTypeCypherDirective) {
    return customMutation(
      (0, _extends3.default)({}, mutationInfo, {
        mutationTypeCypherDirective: mutationTypeCypherDirective,
        variableName: variableName,
        orderByValue: orderByValue,
        outerSkipLimit: outerSkipLimit
      })
    );
  } else if ((0, _utils.isCreateMutation)(resolveInfo)) {
    return nodeCreate(
      (0, _extends3.default)({}, mutationInfo, {
        variableName: variableName,
        typeName: typeName
      })
    );
  } else if ((0, _utils.isUpdateMutation)(resolveInfo)) {
    return nodeUpdate(
      (0, _extends3.default)({}, mutationInfo, {
        variableName: variableName,
        typeName: typeName
      })
    );
  } else if ((0, _utils.isDeleteMutation)(resolveInfo)) {
    return nodeDelete(
      (0, _extends3.default)({}, mutationInfo, {
        variableName: variableName,
        typeName: typeName
      })
    );
  } else if ((0, _utils.isAddMutation)(resolveInfo)) {
    // TODO what is the value of variableName in these cases?
    // perhaps I haven't been using it when it could be useful
    return relationshipCreate((0, _extends3.default)({}, mutationInfo));
  } else if ((0, _utils.isRemoveMutation)(resolveInfo)) {
    return relationshipDelete(
      (0, _extends3.default)({}, mutationInfo, {
        variableName: variableName
      })
    );
  } else {
    // throw error - don't know how to handle this type of mutation
    throw new Error(
      'Do not know how to handle this type of mutation. Mutation does not follow naming convention.'
    );
  }
});

// Custom write operation
var customMutation = function customMutation(_ref13) {
  var params = _ref13.params,
    mutationTypeCypherDirective = _ref13.mutationTypeCypherDirective,
    selections = _ref13.selections,
    variableName = _ref13.variableName,
    schemaType = _ref13.schemaType,
    resolveInfo = _ref13.resolveInfo,
    orderByValue = _ref13.orderByValue,
    outerSkipLimit = _ref13.outerSkipLimit;

  var safeVariableName = (0, _utils.safeVar)(variableName);
  // FIXME: support IN for multiple values -> WHERE
  var argString = (0, _utils.innerFilterParams)(
    (0, _utils.getFilterParams)(params.params || params)
  );
  var cypherQueryArg = mutationTypeCypherDirective.arguments.find(function(x) {
    return x.name.value === 'statement';
  });

  var _buildCypherSelection5 = (0, _selections.buildCypherSelection)({
      initial: '',
      selections: selections,
      variableName: variableName,
      schemaType: schemaType,
      resolveInfo: resolveInfo,
      paramIndex: 1
    }),
    _buildCypherSelection6 = (0, _slicedToArray3.default)(
      _buildCypherSelection5,
      2
    ),
    subQuery = _buildCypherSelection6[0],
    subParams = _buildCypherSelection6[1];

  params = (0, _extends3.default)({}, params, subParams);
  var query =
    'CALL apoc.cypher.doIt("' +
    cypherQueryArg.value.value +
    '", ' +
    argString +
    ') YIELD value\n    WITH apoc.map.values(value, [keys(value)[0]])[0] AS ' +
    safeVariableName +
    '\n    RETURN ' +
    safeVariableName +
    ' {' +
    subQuery +
    '} AS ' +
    safeVariableName +
    orderByValue +
    ' ' +
    outerSkipLimit;
  return [query, params];
};

// Generated API
// Node Create - Update - Delete
var nodeCreate = function nodeCreate(_ref14) {
  var variableName = _ref14.variableName,
    typeName = _ref14.typeName,
    selections = _ref14.selections,
    schemaType = _ref14.schemaType,
    resolveInfo = _ref14.resolveInfo,
    params = _ref14.params;

  var safeVariableName = (0, _utils.safeVar)(variableName);
  var safeLabelName = (0, _utils.safeLabel)(typeName);
  var statements = [];
  var args = (0, _utils.getMutationArguments)(resolveInfo);
  statements = (0, _utils.possiblySetFirstId)({
    args: args,
    statements: statements,
    params: params.params
  });

  var _buildCypherParameter = (0, _utils.buildCypherParameters)({
      args: args,
      statements: statements,
      params: params,
      paramKey: 'params'
    }),
    _buildCypherParameter2 = (0, _slicedToArray3.default)(
      _buildCypherParameter,
      2
    ),
    preparedParams = _buildCypherParameter2[0],
    paramStatements = _buildCypherParameter2[1];

  var _buildCypherSelection7 = (0, _selections.buildCypherSelection)({
      initial: '',
      selections: selections,
      variableName: variableName,
      schemaType: schemaType,
      resolveInfo: resolveInfo,
      paramIndex: 1
    }),
    _buildCypherSelection8 = (0, _slicedToArray3.default)(
      _buildCypherSelection7,
      2
    ),
    subQuery = _buildCypherSelection8[0],
    subParams = _buildCypherSelection8[1];

  params = (0, _extends3.default)({}, preparedParams, subParams);
  var query =
    '\n    CREATE (' +
    safeVariableName +
    ':' +
    safeLabelName +
    ' {' +
    paramStatements.join(',') +
    '})\n    RETURN ' +
    safeVariableName +
    ' {' +
    subQuery +
    '} AS ' +
    safeVariableName +
    '\n  ';
  return [query, params];
};

var splitSelectionParameters = function splitSelectionParameters(
  params,
  primaryKeyArgName,
  paramKey
) {
  var paramKeys = paramKey
    ? (0, _keys2.default)(params[paramKey])
    : (0, _keys2.default)(params);

  var _paramKeys$reduce = paramKeys.reduce(
      function(acc, t) {
        if (t === primaryKeyArgName) {
          if (paramKey) {
            acc[0][t] = params[paramKey][t];
          } else {
            acc[0][t] = params[t];
          }
        } else {
          if (paramKey) {
            if (acc[1][paramKey] === undefined) acc[1][paramKey] = {};
            acc[1][paramKey][t] = params[paramKey][t];
          } else {
            acc[1][t] = params[t];
          }
        }
        return acc;
      },
      [{}, {}]
    ),
    _paramKeys$reduce2 = (0, _slicedToArray3.default)(_paramKeys$reduce, 2),
    primaryKeyParam = _paramKeys$reduce2[0],
    updateParams = _paramKeys$reduce2[1];

  var first = params.first;
  var offset = params.offset;
  if (first !== undefined) updateParams['first'] = first;
  if (offset !== undefined) updateParams['offset'] = offset;
  return [primaryKeyParam, updateParams];
};
var nodeUpdate = function nodeUpdate(_ref15) {
  var resolveInfo = _ref15.resolveInfo,
    variableName = _ref15.variableName,
    typeName = _ref15.typeName,
    selections = _ref15.selections,
    schemaType = _ref15.schemaType,
    params = _ref15.params;

  var safeVariableName = (0, _utils.safeVar)(variableName);
  var safeLabelName = (0, _utils.safeLabel)(typeName);
  var args = (0, _utils.getMutationArguments)(resolveInfo);
  var primaryKeyArg = args[0];
  var primaryKeyArgName = primaryKeyArg.name.value;
  var temporalArgs = (0, _utils.getTemporalArguments)(args);

  var _splitSelectionParame = splitSelectionParameters(
      params,
      primaryKeyArgName,
      'params'
    ),
    _splitSelectionParame2 = (0, _slicedToArray3.default)(
      _splitSelectionParame,
      2
    ),
    primaryKeyParam = _splitSelectionParame2[0],
    updateParams = _splitSelectionParame2[1];

  var temporalClauses = (0, _utils.temporalPredicateClauses)(
    primaryKeyParam,
    safeVariableName,
    temporalArgs,
    'params'
  );
  var predicateClauses = []
    .concat((0, _toConsumableArray3.default)(temporalClauses))
    .filter(function(predicate) {
      return !!predicate;
    })
    .join(' AND ');
  var predicate = predicateClauses ? 'WHERE ' + predicateClauses + ' ' : '';

  var _buildCypherParameter3 = (0, _utils.buildCypherParameters)({
      args: args,
      params: updateParams,
      paramKey: 'params'
    }),
    _buildCypherParameter4 = (0, _slicedToArray3.default)(
      _buildCypherParameter3,
      2
    ),
    preparedParams = _buildCypherParameter4[0],
    paramUpdateStatements = _buildCypherParameter4[1];

  var query =
    'MATCH (' +
    safeVariableName +
    ':' +
    safeLabelName +
    (predicate !== ''
      ? ') ' + predicate + ' '
      : '{' + primaryKeyArgName + ': $params.' + primaryKeyArgName + '})') +
    '\n  ';
  if (paramUpdateStatements.length > 0) {
    query +=
      'SET ' +
      safeVariableName +
      ' += {' +
      paramUpdateStatements.join(',') +
      '} ';
  }

  var _buildCypherSelection9 = (0, _selections.buildCypherSelection)({
      initial: '',
      selections: selections,
      variableName: variableName,
      schemaType: schemaType,
      resolveInfo: resolveInfo,
      paramIndex: 1
    }),
    _buildCypherSelection10 = (0, _slicedToArray3.default)(
      _buildCypherSelection9,
      2
    ),
    subQuery = _buildCypherSelection10[0],
    subParams = _buildCypherSelection10[1];

  preparedParams.params[primaryKeyArgName] = primaryKeyParam[primaryKeyArgName];
  params = (0, _extends3.default)({}, preparedParams, subParams);
  query +=
    'RETURN ' + safeVariableName + ' {' + subQuery + '} AS ' + safeVariableName;
  return [query, params];
};

var nodeDelete = function nodeDelete(_ref16) {
  var resolveInfo = _ref16.resolveInfo,
    selections = _ref16.selections,
    variableName = _ref16.variableName,
    typeName = _ref16.typeName,
    schemaType = _ref16.schemaType,
    params = _ref16.params;

  var safeVariableName = (0, _utils.safeVar)(variableName);
  var safeLabelName = (0, _utils.safeLabel)(typeName);
  var args = (0, _utils.getMutationArguments)(resolveInfo);
  var primaryKeyArg = args[0];
  var primaryKeyArgName = primaryKeyArg.name.value;
  var temporalArgs = (0, _utils.getTemporalArguments)(args);

  var _splitSelectionParame3 = splitSelectionParameters(
      params,
      primaryKeyArgName
    ),
    _splitSelectionParame4 = (0, _slicedToArray3.default)(
      _splitSelectionParame3,
      1
    ),
    primaryKeyParam = _splitSelectionParame4[0];

  var temporalClauses = (0, _utils.temporalPredicateClauses)(
    primaryKeyParam,
    safeVariableName,
    temporalArgs
  );

  var _buildCypherParameter5 = (0, _utils.buildCypherParameters)({
      args: args,
      params: params
    }),
    _buildCypherParameter6 = (0, _slicedToArray3.default)(
      _buildCypherParameter5,
      1
    ),
    preparedParams = _buildCypherParameter6[0];

  var query =
    'MATCH (' +
    safeVariableName +
    ':' +
    safeLabelName +
    (temporalClauses.length > 0
      ? ') WHERE ' + temporalClauses.join(' AND ')
      : ' {' + primaryKeyArgName + ': $' + primaryKeyArgName + '})');

  var _buildCypherSelection11 = (0, _selections.buildCypherSelection)({
      initial: '',
      selections: selections,
      variableName: variableName,
      schemaType: schemaType,
      resolveInfo: resolveInfo,
      paramIndex: 1
    }),
    _buildCypherSelection12 = (0, _slicedToArray3.default)(
      _buildCypherSelection11,
      2
    ),
    subQuery = _buildCypherSelection12[0],
    subParams = _buildCypherSelection12[1];
  // preparedParams[primaryKeyArgName] = primaryKeyParam[primaryKeyArgName];

  params = (0, _extends3.default)({}, preparedParams, subParams);
  var deletionVariableName = (0, _utils.safeVar)(variableName + '_toDelete');
  // Cannot execute a map projection on a deleted node in Neo4j
  // so the projection is executed and aliased before the delete
  query +=
    '\nWITH ' +
    safeVariableName +
    ' AS ' +
    deletionVariableName +
    ', ' +
    safeVariableName +
    ' {' +
    subQuery +
    '} AS ' +
    safeVariableName +
    '\nDETACH DELETE ' +
    deletionVariableName +
    '\nRETURN ' +
    safeVariableName;
  return [query, params];
};

// Relation Add / Remove
var relationshipCreate = function relationshipCreate(_ref17) {
  var resolveInfo = _ref17.resolveInfo,
    selections = _ref17.selections,
    schemaType = _ref17.schemaType,
    params = _ref17.params;

  var mutationMeta = void 0,
    relationshipNameArg = void 0,
    fromTypeArg = void 0,
    toTypeArg = void 0;
  try {
    mutationMeta = resolveInfo.schema
      .getMutationType()
      .getFields()
      [resolveInfo.fieldName].astNode.directives.find(function(x) {
        return x.name.value === 'MutationMeta';
      });
  } catch (e) {
    throw new Error(
      'Missing required MutationMeta directive on add relationship directive'
    );
  }

  try {
    relationshipNameArg = mutationMeta.arguments.find(function(x) {
      return x.name.value === 'relationship';
    });
    fromTypeArg = mutationMeta.arguments.find(function(x) {
      return x.name.value === 'from';
    });
    toTypeArg = mutationMeta.arguments.find(function(x) {
      return x.name.value === 'to';
    });
  } catch (e) {
    throw new Error(
      'Missing required argument in MutationMeta directive (relationship, from, or to)'
    );
  }

  //TODO: need to handle one-to-one and one-to-many
  var args = (0, _utils.getMutationArguments)(resolveInfo);
  var typeMap = resolveInfo.schema.getTypeMap();

  var fromType = fromTypeArg.value.value;
  var fromVar = (0, _utils.lowFirstLetter)(fromType) + '_from';
  var fromInputArg = args.find(function(e) {
    return e.name.value === 'from';
  }).type;
  var fromInputAst =
    typeMap[(0, _graphql.getNamedType)(fromInputArg).type.name.value].astNode;
  var fromFields = fromInputAst.fields;
  var fromParam = fromFields[0].name.value;
  var fromTemporalArgs = (0, _utils.getTemporalArguments)(fromFields);

  var toType = toTypeArg.value.value;
  var toVar = (0, _utils.lowFirstLetter)(toType) + '_to';
  var toInputArg = args.find(function(e) {
    return e.name.value === 'to';
  }).type;
  var toInputAst =
    typeMap[(0, _graphql.getNamedType)(toInputArg).type.name.value].astNode;
  var toFields = toInputAst.fields;
  var toParam = toFields[0].name.value;
  var toTemporalArgs = (0, _utils.getTemporalArguments)(toFields);

  var relationshipName = relationshipNameArg.value.value;
  var lowercased = relationshipName.toLowerCase();
  var dataInputArg = args.find(function(e) {
    return e.name.value === 'data';
  });
  var dataInputAst = dataInputArg
    ? typeMap[(0, _graphql.getNamedType)(dataInputArg.type).type.name.value]
        .astNode
    : undefined;
  var dataFields = dataInputAst ? dataInputAst.fields : [];

  var _buildCypherParameter7 = (0, _utils.buildCypherParameters)({
      args: dataFields,
      params: params,
      paramKey: 'data'
    }),
    _buildCypherParameter8 = (0, _slicedToArray3.default)(
      _buildCypherParameter7,
      2
    ),
    preparedParams = _buildCypherParameter8[0],
    paramStatements = _buildCypherParameter8[1];

  var schemaTypeName = (0, _utils.safeVar)(schemaType);
  var fromVariable = (0, _utils.safeVar)(fromVar);
  var fromLabel = (0, _utils.safeLabel)(fromType);
  var toVariable = (0, _utils.safeVar)(toVar);
  var toLabel = (0, _utils.safeLabel)(toType);
  var relationshipVariable = (0, _utils.safeVar)(lowercased + '_relation');
  var relationshipLabel = (0, _utils.safeLabel)(relationshipName);
  var fromTemporalClauses = (0, _utils.temporalPredicateClauses)(
    preparedParams.from,
    fromVariable,
    fromTemporalArgs,
    'from'
  );
  var toTemporalClauses = (0, _utils.temporalPredicateClauses)(
    preparedParams.to,
    toVariable,
    toTemporalArgs,
    'to'
  );

  var _buildCypherSelection13 = (0, _selections.buildCypherSelection)({
      initial: '',
      selections: selections,
      schemaType: schemaType,
      resolveInfo: resolveInfo,
      paramIndex: 1,
      rootVariableNames: {
        from: '' + fromVar,
        to: '' + toVar
      },
      variableName: schemaType.name === fromType ? '' + toVar : '' + fromVar
    }),
    _buildCypherSelection14 = (0, _slicedToArray3.default)(
      _buildCypherSelection13,
      2
    ),
    subQuery = _buildCypherSelection14[0],
    subParams = _buildCypherSelection14[1];

  params = (0, _extends3.default)({}, preparedParams, subParams);
  var query =
    '\n      MATCH (' +
    fromVariable +
    ':' +
    fromLabel +
    ' ' +
    (fromTemporalClauses && fromTemporalClauses.length > 0
      ? // uses either a WHERE clause for managed type primary keys (temporal, etc.)
        ') WHERE ' + fromTemporalClauses.join(' AND ') + ' '
      : // or a an internal matching clause for normal, scalar property primary keys
        // NOTE this will need to change if we at some point allow for multi field node selection
        '{' + fromParam + ': $from.' + fromParam + '})') +
    '\n      MATCH (' +
    toVariable +
    ':' +
    toLabel +
    ' ' +
    (toTemporalClauses && toTemporalClauses.length > 0
      ? ') WHERE ' + toTemporalClauses.join(' AND ') + ' '
      : '{' + toParam + ': $to.' + toParam + '})') +
    '\n      CREATE (' +
    fromVariable +
    ')-[' +
    relationshipVariable +
    ':' +
    relationshipLabel +
    (paramStatements.length > 0 ? ' {' + paramStatements.join(',') + '}' : '') +
    ']->(' +
    toVariable +
    ')\n      RETURN ' +
    relationshipVariable +
    ' { ' +
    subQuery +
    ' } AS ' +
    schemaTypeName +
    ';\n    ';
  return [query, params];
};

var relationshipDelete = function relationshipDelete(_ref18) {
  var resolveInfo = _ref18.resolveInfo,
    selections = _ref18.selections,
    variableName = _ref18.variableName,
    schemaType = _ref18.schemaType,
    params = _ref18.params;

  var mutationMeta = void 0,
    relationshipNameArg = void 0,
    fromTypeArg = void 0,
    toTypeArg = void 0;
  try {
    mutationMeta = resolveInfo.schema
      .getMutationType()
      .getFields()
      [resolveInfo.fieldName].astNode.directives.find(function(x) {
        return x.name.value === 'MutationMeta';
      });
  } catch (e) {
    throw new Error(
      'Missing required MutationMeta directive on add relationship directive'
    );
  }

  try {
    relationshipNameArg = mutationMeta.arguments.find(function(x) {
      return x.name.value === 'relationship';
    });
    fromTypeArg = mutationMeta.arguments.find(function(x) {
      return x.name.value === 'from';
    });
    toTypeArg = mutationMeta.arguments.find(function(x) {
      return x.name.value === 'to';
    });
  } catch (e) {
    throw new Error(
      'Missing required argument in MutationMeta directive (relationship, from, or to)'
    );
  }

  //TODO: need to handle one-to-one and one-to-many
  var args = (0, _utils.getMutationArguments)(resolveInfo);
  var typeMap = resolveInfo.schema.getTypeMap();

  var fromType = fromTypeArg.value.value;
  var fromVar = (0, _utils.lowFirstLetter)(fromType) + '_from';
  var fromInputArg = args.find(function(e) {
    return e.name.value === 'from';
  }).type;
  var fromInputAst =
    typeMap[(0, _graphql.getNamedType)(fromInputArg).type.name.value].astNode;
  var fromFields = fromInputAst.fields;
  var fromParam = fromFields[0].name.value;
  var fromTemporalArgs = (0, _utils.getTemporalArguments)(fromFields);

  var toType = toTypeArg.value.value;
  var toVar = (0, _utils.lowFirstLetter)(toType) + '_to';
  var toInputArg = args.find(function(e) {
    return e.name.value === 'to';
  }).type;
  var toInputAst =
    typeMap[(0, _graphql.getNamedType)(toInputArg).type.name.value].astNode;
  var toFields = toInputAst.fields;
  var toParam = toFields[0].name.value;
  var toTemporalArgs = (0, _utils.getTemporalArguments)(toFields);

  var relationshipName = relationshipNameArg.value.value;

  var schemaTypeName = (0, _utils.safeVar)(schemaType);
  var fromVariable = (0, _utils.safeVar)(fromVar);
  var fromLabel = (0, _utils.safeLabel)(fromType);
  var toVariable = (0, _utils.safeVar)(toVar);
  var toLabel = (0, _utils.safeLabel)(toType);
  var relationshipVariable = (0, _utils.safeVar)(fromVar + toVar);
  var relationshipLabel = (0, _utils.safeLabel)(relationshipName);
  var fromRootVariable = (0, _utils.safeVar)('_' + fromVar);
  var toRootVariable = (0, _utils.safeVar)('_' + toVar);
  var fromTemporalClauses = (0, _utils.temporalPredicateClauses)(
    params.from,
    fromVariable,
    fromTemporalArgs,
    'from'
  );
  var toTemporalClauses = (0, _utils.temporalPredicateClauses)(
    params.to,
    toVariable,
    toTemporalArgs,
    'to'
  );
  // TODO remove use of _ prefixes in root variableNames and variableName

  var _buildCypherSelection15 = (0, _selections.buildCypherSelection)(
      (0, _defineProperty3.default)(
        {
          initial: '',
          selections: selections,
          variableName: variableName,
          schemaType: schemaType,
          resolveInfo: resolveInfo,
          paramIndex: 1,
          rootVariableNames: {
            from: '_' + fromVar,
            to: '_' + toVar
          }
        },
        'variableName',
        schemaType.name === fromType ? '_' + toVar : '_' + fromVar
      )
    ),
    _buildCypherSelection16 = (0, _slicedToArray3.default)(
      _buildCypherSelection15,
      2
    ),
    subQuery = _buildCypherSelection16[0],
    subParams = _buildCypherSelection16[1];

  params = (0, _extends3.default)({}, params, subParams);
  // TODO create builder functions for selection clauses below for both relation mutations
  var query =
    '\n      MATCH (' +
    fromVariable +
    ':' +
    fromLabel +
    ' ' +
    (fromTemporalClauses && fromTemporalClauses.length > 0
      ? // uses either a WHERE clause for managed type primary keys (temporal, etc.)
        ') WHERE ' + fromTemporalClauses.join(' AND ') + ' '
      : // or a an internal matching clause for normal, scalar property primary keys
        '{' + fromParam + ': $from.' + fromParam + '})') +
    '\n      MATCH (' +
    toVariable +
    ':' +
    toLabel +
    ' ' +
    (toTemporalClauses && toTemporalClauses.length > 0
      ? ') WHERE ' + toTemporalClauses.join(' AND ') + ' '
      : '{' + toParam + ': $to.' + toParam + '})') +
    '\n      OPTIONAL MATCH (' +
    fromVariable +
    ')-[' +
    relationshipVariable +
    ':' +
    relationshipLabel +
    ']->(' +
    toVariable +
    ')\n      DELETE ' +
    relationshipVariable +
    '\n      WITH COUNT(*) AS scope, ' +
    fromVariable +
    ' AS ' +
    fromRootVariable +
    ', ' +
    toVariable +
    ' AS ' +
    toRootVariable +
    '\n      RETURN {' +
    subQuery +
    '} AS ' +
    schemaTypeName +
    ';\n    ';
  return [query, params];
};
