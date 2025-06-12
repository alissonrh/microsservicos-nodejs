import * as pulumi from '@pulumi/pulumi'
import * as awsx from '@pulumi/awsx'

import { cluster } from '../cluster'
import { amqpListener } from './rabbitmq'
import { ordersDockerImage } from '../images/orders'
import { appLoadBalancer } from '../load-balancer'

const ordersTargetGroup = appLoadBalancer.createTargetGroup('orders-target', {
  port: 3333,
  protocol: 'HTTP',
  healthCheck: {
    path: '/health',
    protocol: 'HTTP'
  }
})

export const ordersHttpListener = appLoadBalancer.createListener(
  'orders-listener',
  {
    port: 3333,
    protocol: 'HTTP',
    targetGroup: ordersTargetGroup
  }
)

export const ordersService = new awsx.classic.ecs.FargateService(
  'fargate-orders',
  {
    cluster,
    desiredCount: 1,
    waitForSteadyState: false,
    taskDefinitionArgs: {
      container: {
        image: ordersDockerImage.ref,
        cpu: 256,
        memory: 512,
        portMappings: [ordersHttpListener],
        environment: [
          {
            name: 'BROKER_URL',
            value: pulumi.interpolate`amqp://admin:admin@${amqpListener.endpoint.hostname}:${amqpListener.endpoint.port}`
          },
          {
            name: 'DATABASE_URL',
            value:
              'postgresql://orders_owner:npg_3hfP5LZxulCO@ep-dark-lake-a4hf4csj.us-east-1.aws.neon.tech/orders?sslmode=require'
          },
          {
            name: 'OTEL_TRACES_EXPORTER',
            value: 'otlp'
          },
          {
            name: 'OTEL_EXPORTER_OTLP_ENDPOINT',
            value: 'https://otlp-gateway-prod-sa-east-1.grafana.net/otlp'
          },
          {
            name: 'OTEL_EXPORTER_OTLP_HEADERS',
            value:
              'Authorization=Basic MTI4NjU3MDpnbGNfZXlKdklqb2lNVFExTmpBMk15SXNJbTRpT2lKbmNtRm1ZVzVoTFc1dlpHVnFjeUlzSW1zaU9pSkhNMlpCYlRnMGFsbFRZMVl3VXpjemVEUTFVbUUxTlhZaUxDSnRJanA3SW5JaU9pSndjbTlrTFhOaExXVmhjM1F0TVNKOWZRPT0='
          },
          {
            name: 'OTEL_SERVICE_NAME',
            value: 'orders'
          },
          {
            name: 'OTEL_RESOURCE_ATTRIBUTES',
            value:
              'service.name=my-app,service.namespace=my-application-group,deployment.environment=production'
          },
          {
            name: 'OTEL_NODE_RESOURCE_DETECTORS',
            value: 'env,host,os'
          },
          {
            name: 'OTEL_NODE_ENABLED_INSTRUMENTATIONS',
            value: 'http,fastify,pg,amqplib'
          }
        ]
      }
    }
  }
)
