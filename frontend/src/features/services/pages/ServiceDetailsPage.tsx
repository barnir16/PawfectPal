import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  MockServiceDetails,
  type ServiceDetails,
} from "../../../services/services/MockServiceDetails";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default markers in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const ServiceDetailsPage = () => {
  const { id } = useParams();
  const [service, setService] = useState<ServiceDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      MockServiceDetails.getServiceDetails(Number(id))
        .then((s) => setService(s))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading)
    return <p className="text-center mt-10">Loading service details...</p>;
  if (!service) return <p className="text-center mt-10">Service not found.</p>;

  // Determine status color
  let statusColor = "text-yellow-600";
  if (service.status === "completed") statusColor = "text-green-600";
  else if (service.status === "cancelled") statusColor = "text-red-600";

  // Prepare polyline positions if gps.path exists
  const polylinePositions: [number, number][] =
    service.gps?.path?.map(
      (point) => [point.lat, point.lng] as [number, number]
    ) || [];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        {service.service_type.toUpperCase()} - {service.pet_name}
      </h1>

      {/* Status & Dates */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <strong>Status:</strong>{" "}
          <span className={`capitalize ${statusColor}`}>
            {service.status.replace("_", " ")}
          </span>
        </div>
        <div>
          <strong>Start:</strong>{" "}
          {new Date(service.start_datetime).toLocaleString()}
        </div>
        {service.end_datetime && (
          <div>
            <strong>End:</strong>{" "}
            {new Date(service.end_datetime).toLocaleString()}
          </div>
        )}
        <div>
          <strong>Currency:</strong> {service.currency}
        </div>
      </div>

      {/* Notes */}
      {service.notes && (
        <div className="mb-6 p-4 border rounded-md bg-gray-50">
          <h2 className="font-semibold mb-2">Notes</h2>
          <p>{service.notes}</p>
        </div>
      )}

      {/* Grooming Steps */}
      {service.groomingSteps && service.groomingSteps.length > 0 && (
        <div className="mb-6 p-4 border rounded-md bg-gray-50">
          <h2 className="font-semibold mb-2">Grooming Steps</h2>
          <ol className="list-decimal list-inside">
            {service.groomingSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Before / After Images */}
      {["Before Images", "After Images"].map((label, idx) => {
        const images = idx === 0 ? service.before_images : service.after_images;
        return (
          <div key={label} className="mb-6">
            <h2 className="font-semibold mb-2">{label}</h2>
            {images.length === 0 ? (
              <p className="text-gray-500">No images</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {images.map((src) => (
                  <img
                    key={src}
                    src={src}
                    alt={`${label.toLowerCase()}-${src}`}
                    className="w-28 h-28 object-cover rounded-md border"
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* GPS / Map */}
      {service.service_type === "walking" && service.gps && (
        <div className="mb-6 p-4 border rounded-md bg-gray-50">
          <h2 className="font-semibold mb-2">GPS / Map</h2>
          <p>
            Start: {service.gps.lat}, {service.gps.lng}
          </p>
          <p>Path points: {service.gps.path ? service.gps.path.length : 0}</p>

          {polylinePositions.length > 0 ? (
            <MapContainer
              center={[service.gps.lat, service.gps.lng] as [number, number]}
              zoom={16}
              scrollWheelZoom={false}
              style={{ height: "400px", width: "100%" }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <>
                <Polyline positions={polylinePositions} color="blue" />
                <Marker position={polylinePositions[0]}>
                  <Popup>Start</Popup>
                </Marker>
                <Marker position={polylinePositions[polylinePositions.length - 1]}>
                  <Popup>End</Popup>
                </Marker>
              </>
            </MapContainer>
          ) : (
            <div className="mt-2 p-4 bg-gray-200 text-gray-600 text-center rounded-md">
              Map placeholder
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ServiceDetailsPage;
