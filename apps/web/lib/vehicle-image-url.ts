type VehicleImageReference = {
  id: string;
  storageKey: string;
};

export function publicVehicleImageUrl(image: VehicleImageReference): string {
  if (image.storageKey.startsWith('vehicle-images/')) {
    return `/api/v1/vehicles/images/${image.id}/content`;
  }
  return `/${image.storageKey.replace(/^\/+/, '')}`;
}

export function hostVehicleImageUrl(
  vehicleId: string,
  image: VehicleImageReference,
): string {
  if (image.storageKey.startsWith('vehicle-images/')) {
    return `/api/v1/hosts/vehicles/${vehicleId}/images/${image.id}/content`;
  }
  return publicVehicleImageUrl(image);
}
