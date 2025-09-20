import React from 'react';
import { AlertCircle, Database, User, Image } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MinisiteDebugPanelProps {
  broker: any;
  properties: any[];
  errors: string[];
  config: any;
}

export function MinisiteDebugPanel({ broker, properties, errors, config }: MinisiteDebugPanelProps) {
  const isDebugMode = new URLSearchParams(window.location.search).get('debug') === '1' || 
                      localStorage.getItem('minisite_debug') === '1';

  if (!isDebugMode) return null;

  return (
    <div className="fixed bottom-4 right-4 max-w-md z-50">
      <Card className="bg-white/95 backdrop-blur-sm border-orange-200 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-orange-700">
            <AlertCircle className="h-4 w-4" />
            Debug Minisite
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-3">
          <div className="flex items-start gap-2">
            <User className="h-4 w-4 text-blue-500 mt-0.5" />
            <div>
              <p className="font-semibold">Broker Info</p>
              <p>ID: <code className="bg-gray-100 px-1 rounded">{broker?.id || 'null'}</code></p>
              <p>User ID: <code className="bg-gray-100 px-1 rounded">{broker?.user_id || 'null'}</code></p>
              <p>Username: <code className="bg-gray-100 px-1 rounded">{broker?.username || 'null'}</code></p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Database className="h-4 w-4 text-green-500 mt-0.5" />
            <div>
              <p className="font-semibold">Properties</p>
              <p>Found: <Badge variant="outline">{properties?.length || 0}</Badge></p>
              <p className="text-gray-600">Query: properties WHERE user_id = '{broker?.user_id}' AND is_public = true AND visibility = 'public_site'</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Image className="h-4 w-4 text-purple-500 mt-0.5" />
            <div>
              <p className="font-semibold">Config</p>
              <p>Template: <code className="bg-gray-100 px-1 rounded">{config?.template_id || 'default'}</code></p>
              <p>Show Properties: <Badge variant={config?.show_properties ? "default" : "secondary"}>{config?.show_properties ? "Yes" : "No"}</Badge></p>
            </div>
          </div>

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded p-2">
              <p className="font-semibold text-red-800">Errors ({errors.length})</p>
              <ul className="list-disc list-inside text-red-700">
                {errors.slice(0, 3).map((err, i) => (
                  <li key={i} className="truncate" title={err}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="border-t pt-2 text-gray-500">
            <p>URL: <code className="bg-gray-100 px-1 rounded text-xs">{window.location.pathname}</code></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}