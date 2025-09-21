#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
require("source-map-support/register");
const cdk = __importStar(require("aws-cdk-lib"));
const flowfi_stack_1 = require("./flowfi-stack");
const app = new cdk.App();
new flowfi_stack_1.FlowFiStack(app, 'FlowFiStack', {
    description: 'The FlowFi stack for document processing and management.',
    tags: {
        'project': 'FlowFi',
        'environment': 'dev'
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vYXBwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsdUNBQXFDO0FBQ3JDLGlEQUFtQztBQUNuQyxpREFBNkM7QUFFN0MsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDMUIsSUFBSSwwQkFBVyxDQUFDLEdBQUcsRUFBRSxhQUFhLEVBQUU7SUFDbEMsV0FBVyxFQUFFLDBEQUEwRDtJQUN2RSxJQUFJLEVBQUU7UUFDSixTQUFTLEVBQUUsUUFBUTtRQUNuQixhQUFhLEVBQUUsS0FBSztLQUNyQjtDQUNGLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcbmltcG9ydCAnc291cmNlLW1hcC1zdXBwb3J0L3JlZ2lzdGVyJztcbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBGbG93RmlTdGFjayB9IGZyb20gJy4vZmxvd2ZpLXN0YWNrJztcblxuY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcbm5ldyBGbG93RmlTdGFjayhhcHAsICdGbG93RmlTdGFjaycsIHtcbiAgZGVzY3JpcHRpb246ICdUaGUgRmxvd0ZpIHN0YWNrIGZvciBkb2N1bWVudCBwcm9jZXNzaW5nIGFuZCBtYW5hZ2VtZW50LicsXG4gIHRhZ3M6IHtcbiAgICAncHJvamVjdCc6ICdGbG93RmknLFxuICAgICdlbnZpcm9ubWVudCc6ICdkZXYnXG4gIH1cbn0pOyJdfQ==