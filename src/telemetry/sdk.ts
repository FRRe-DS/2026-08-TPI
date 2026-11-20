import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

const shouldEnableOtel =
  process.env.NODE_ENV !== 'test' &&
  process.env.OTEL_ENABLED !== 'false' &&
  Boolean(process.env.OTEL_EXPORTER_OTLP_ENDPOINT);

let sdk: NodeSDK | null = null;

if (shouldEnableOtel) {
  const serviceName = process.env.OTEL_SERVICE_NAME || 'm9-reservas-grupo-08';

  sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
      [ATTR_SERVICE_VERSION]: '1.0.0'
    }),
    traceExporter: new OTLPTraceExporter(),
    metricReaders: [
      new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter(),
        exportIntervalMillis: 10000
      })
    ],
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false }
      })
    ]
  });

  sdk.start();
  console.log(`[OpenTelemetry] Telemetría iniciada para ${serviceName} -> ${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}`);
}

export const shutdownTelemetry = async (): Promise<void> => {
  if (sdk) {
    await sdk.shutdown();
  }
};
