import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface GeofenceRadiusControlProps {
  radius: number;
  onRadiusChange: (radius: number) => void;
}

export default function GeofenceRadiusControl({ radius, onRadiusChange }: GeofenceRadiusControlProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Geofence Radius</CardTitle>
        <CardDescription>Students must be within this distance to mark attendance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Radius: {radius}m</Label>
            <span className="text-sm text-muted-foreground">
              {radius < 100 ? "Very Strict" : radius < 200 ? "Strict" : radius < 300 ? "Moderate" : "Lenient"}
            </span>
          </div>
          <Slider value={[radius]} onValueChange={(values) => onRadiusChange(values[0])} min={50} max={500} step={5} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>50m</span>
            <span>500m</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
