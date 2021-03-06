'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.extractResolversFromSchema = exports.extractTypeMapFromSchema = exports.makeAugmentedExecutableSchema = exports.augmentedSchema = undefined;

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _graphqlTools = require('graphql-tools');

var _utils = require('./utils');

var _augment = require('./augment');

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

var augmentedSchema = (exports.augmentedSchema = function augmentedSchema(
  typeMap,
  resolvers,
  config
) {
  var augmentedTypeMap = (0, _augment.augmentTypeMap)(typeMap, config);
  var augmentedResolvers = (0, _augment.augmentResolvers)(
    augmentedTypeMap,
    resolvers
  );
  return (0, _graphqlTools.makeExecutableSchema)({
    typeDefs: (0, _utils.printTypeMap)(augmentedTypeMap),
    resolvers: augmentedResolvers,
    resolverValidationOptions: {
      requireResolversForResolveType: false
    }
  });
});

var makeAugmentedExecutableSchema = (exports.makeAugmentedExecutableSchema = function makeAugmentedExecutableSchema(
  _ref
) {
  var typeDefs = _ref.typeDefs,
    resolvers = _ref.resolvers,
    logger = _ref.logger,
    allowUndefinedInResolve = _ref.allowUndefinedInResolve,
    resolverValidationOptions = _ref.resolverValidationOptions,
    directiveResolvers = _ref.directiveResolvers,
    schemaDirectives = _ref.schemaDirectives,
    parseOptions = _ref.parseOptions,
    inheritResolversFromInterfaces = _ref.inheritResolversFromInterfaces,
    config = _ref.config;

  var typeMap = (0, _utils.extractTypeMapFromTypeDefs)(typeDefs);
  var augmentedTypeMap = (0, _augment.augmentTypeMap)(typeMap, config);
  var augmentedResolvers = (0, _augment.augmentResolvers)(
    augmentedTypeMap,
    resolvers
  );
  resolverValidationOptions.requireResolversForResolveType = false;
  return (0, _graphqlTools.makeExecutableSchema)({
    typeDefs: (0, _utils.printTypeMap)(augmentedTypeMap),
    resolvers: augmentedResolvers,
    logger: logger,
    allowUndefinedInResolve: allowUndefinedInResolve,
    resolverValidationOptions: resolverValidationOptions,
    directiveResolvers: directiveResolvers,
    schemaDirectives: schemaDirectives,
    parseOptions: parseOptions,
    inheritResolversFromInterfaces: inheritResolversFromInterfaces
  });
});

var extractTypeMapFromSchema = (exports.extractTypeMapFromSchema = function extractTypeMapFromSchema(
  schema
) {
  var typeMap = schema.getTypeMap();
  var directives = schema.getDirectives();
  var types = (0, _extends3.default)({}, typeMap, directives);
  var astNode = {};
  return (0, _keys2.default)(types).reduce(function(acc, t) {
    astNode = types[t].astNode;
    if (astNode !== undefined) {
      acc[astNode.name.value] = astNode;
    }
    return acc;
  }, {});
});

var extractResolversFromSchema = (exports.extractResolversFromSchema = function extractResolversFromSchema(
  schema
) {
  var _typeMap = schema && schema._typeMap ? schema._typeMap : {};
  var types = (0, _keys2.default)(_typeMap);
  var type = {};
  var schemaTypeResolvers = {};
  return types.reduce(function(acc, t) {
    // prevent extraction from schema introspection system keys
    if (
      t !== '__Schema' &&
      t !== '__Type' &&
      t !== '__TypeKind' &&
      t !== '__Field' &&
      t !== '__InputValue' &&
      t !== '__EnumValue' &&
      t !== '__Directive'
    ) {
      type = _typeMap[t];
      // resolvers are stored on the field level at a .resolve key
      schemaTypeResolvers = extractFieldResolversFromSchemaType(type);
      // do not add unless there exists at least one field resolver for type
      if (schemaTypeResolvers) {
        acc[t] = schemaTypeResolvers;
      }
    }
    return acc;
  }, {});
});

var extractFieldResolversFromSchemaType = function extractFieldResolversFromSchemaType(
  type
) {
  var fields = type._fields;
  var fieldKeys = fields ? (0, _keys2.default)(fields) : [];
  var fieldResolvers =
    fieldKeys.length > 0
      ? fieldKeys.reduce(function(acc, t) {
          // do not add entry for this field unless it has resolver
          if (fields[t].resolve !== undefined) {
            acc[t] = fields[t].resolve;
          }
          return acc;
        }, {})
      : undefined;
  // do not return value unless there exists at least 1 field resolver
  return fieldResolvers && (0, _keys2.default)(fieldResolvers).length > 0
    ? fieldResolvers
    : undefined;
};
