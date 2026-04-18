import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { propertiesApi, type PropertyType } from "@/features/properties/api/properties.api";

export const PropertiesPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    title: "",
    addressLine1: "",
    city: "",
    state: "",
    country: "",
    type: "RESIDENTIAL" as PropertyType,
    listingPrice: ""
  });

  const { data, isLoading } = useQuery({
    queryKey: ["properties", search],
    queryFn: () => propertiesApi.list({ search })
  });

  const createPropertyMutation = useMutation({
    mutationFn: propertiesApi.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["properties"] });
      setForm({
        title: "",
        addressLine1: "",
        city: "",
        state: "",
        country: "",
        type: "RESIDENTIAL",
        listingPrice: ""
      });
    }
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Property Inventory</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div>
              <Label htmlFor="property-title">Title</Label>
              <Input
                id="property-title"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="property-address">Address</Label>
              <Input
                id="property-address"
                value={form.addressLine1}
                onChange={(event) => setForm((prev) => ({ ...prev, addressLine1: event.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="property-city">City</Label>
              <Input
                id="property-city"
                value={form.city}
                onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="property-state">State</Label>
              <Input
                id="property-state"
                value={form.state}
                onChange={(event) => setForm((prev) => ({ ...prev, state: event.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="property-country">Country</Label>
              <Input
                id="property-country"
                value={form.country}
                onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="property-type">Type</Label>
              <select
                id="property-type"
                className="h-10 w-full rounded-md border bg-card px-3 text-sm"
                value={form.type}
                onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as PropertyType }))}
              >
                <option value="RESIDENTIAL">Residential</option>
                <option value="COMMERCIAL">Commercial</option>
                <option value="LAND">Land</option>
                <option value="INDUSTRIAL">Industrial</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <Label htmlFor="property-price">Listing price</Label>
              <Input
                id="property-price"
                type="number"
                value={form.listingPrice}
                onChange={(event) => setForm((prev) => ({ ...prev, listingPrice: event.target.value }))}
              />
            </div>
          </div>

          <Button
            onClick={() =>
              createPropertyMutation.mutate({
                title: form.title.trim(),
                addressLine1: form.addressLine1.trim(),
                city: form.city.trim(),
                state: form.state.trim(),
                country: form.country.trim(),
                type: form.type,
                listingPrice: Number(form.listingPrice)
              })
            }
            disabled={
              !form.title.trim() ||
              !form.addressLine1.trim() ||
              !form.city.trim() ||
              !form.state.trim() ||
              !form.country.trim() ||
              !form.listingPrice ||
              createPropertyMutation.isPending
            }
          >
            {createPropertyMutation.isPending ? "Saving..." : "Add Property"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Property List</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Search properties" value={search} onChange={(event) => setSearch(event.target.value)} />

          {isLoading ? <p className="text-sm text-muted-foreground">Loading properties...</p> : null}

          <div className="grid gap-3 md:grid-cols-2">
            {data?.items?.map((property) => (
              <div key={property.id} className="rounded-lg border bg-card/70 p-4">
                <p className="font-semibold">{property.title}</p>
                <p className="text-xs text-muted-foreground">
                  {property.type} | {property.status}
                </p>
                <p className="text-sm">
                  {property.city}, {property.state}, {property.country}
                </p>
                <p className="text-sm font-medium">{Number(property.listingPrice).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
