import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import MockService from "../../../services/services/mockServices";
import type { Service } from "../../../types";

const ServiceDetailsPage = () => {
  const { id } = useParams();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      MockService.getServiceById(Number(id))
        .then((s) => setService(s))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <p>Loading service details...</p>;
  if (!service) return <p>Service not found.</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">
        {service.service_type.toUpperCase()} - {service.pet_name}
      </h1>

      <div className="mb-2">
        <strong>Status:</strong> {service.status}
      </div>
      <div className="mb-2">
        <strong>Start:</strong>{" "}
        {new Date(service.start_datetime).toLocaleString()}
      </div>
      {service.end_datetime && (
        <div className="mb-2">
          <strong>End:</strong>{" "}
          {new Date(service.end_datetime).toLocaleString()}
        </div>
      )}
      <div className="mb-2">
        <strong>Currency:</strong> {service.currency}
      </div>

      {/* Before Images */}
      <div className="mb-4">
        <strong>Before Images:</strong>
        {service.before_images.length === 0 ? (
          <p>No images</p>
        ) : (
          <div className="flex gap-2 mt-2">
            {service.before_images.map((src) => (
              <img
                key={src} // use src as unique key
                src={src}
                alt={`before-${src}`}
                className="w-24 h-24 object-cover"
              />
            ))}
          </div>
        )}
      </div>

      {/* After Images */}
      <div className="mb-4">
        <strong>After Images:</strong>
        {service.after_images.length === 0 ? (
          <p>No images</p>
        ) : (
          <div className="flex gap-2 mt-2">
            {service.after_images.map((src) => (
              <img
                key={src} // use src as unique key
                src={src}
                alt={`after-${src}`}
                className="w-24 h-24 object-cover"
              />
            ))}
          </div>
        )}
      </div>

      {/* Placeholder for future GPS/map */}
      {service.service_type === "walking" && (
        <div className="mt-6 p-4 border rounded-md">
          <strong>Map / GPS info will go here</strong>
        </div>
      )}
    </div>
  );
};

export default ServiceDetailsPage;
