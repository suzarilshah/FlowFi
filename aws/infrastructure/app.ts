#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { FlowFiStack } from './flowfi-stack';

const app = new cdk.App();
new FlowFiStack(app, 'FlowFiStack', {
  description: 'The FlowFi stack for document processing and management.',
  tags: {
    'project': 'FlowFi',
    'environment': 'dev'
  }
});