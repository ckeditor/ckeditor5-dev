/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module fixtures/emptymodule
 */

// One test removes the entire "utils/eventinfo" module, and as a result the project has only one remaining module "fixtures/example".
// If the project contains only one module, TypeDoc skips creating the Module reflection for it and the generated output has flat structure.
// To keep the structure of the project always the same, we create this empty module.
