import React, { useState, useEffect, useCallback } from 'react';
import { Building2, MapPin, Plus, Shield, Search, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ClassroomItem {
  id: string;
  name: string;
  building: string;
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  radius?: number;
}

export const ClassroomsPage: React.FC = () => {
  const { accessToken } = useAuth();
  const [classrooms, setClassrooms] = useState<ClassroomItem[]>([
    { id: '1', name: 'Room 401', building: 'Technology Block A', latitude: 12.9715987, longitude: 77.5945627, radius: 75 },
    { id: '2', name: 'Room 402', building: 'Technology Block A', latitude: 12.9716500, longitude: 77.5946100, radius: 75 },
    { id: '3', name: 'Computing Lab 3', building: 'Center for Advanced Research', latitude: 12.9718000, longitude: 77.5947000, radius: 80 },
    { id: '4', name: 'Seminar Hall B', building: 'Academic Annex', latitude: 12.9721000, longitude: 77.5949000, radius: 100 },
  ]);

  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBuilding, setNewBuilding] = useState('');
  const [newLat, setNewLat] = useState('12.971700');
  const [newLng, setNewLng] = useState('77.594650');
  const [newRadius, setNewRadius] = useState(75);
  const [loading, setLoading] = useState(false);

  const fetchClassrooms = useCallback(async () => {
    try {
      const token = accessToken || localStorage.getItem('access_token');
      const res = await fetch('http://localhost:3000/api/v1/admin/classrooms', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setClassrooms(
            data.map((c: any) => ({
              id: c.id,
              name: c.name,
              building: c.building,
              latitude: Number(c.latitude),
              longitude: Number(c.longitude),
              radius: c.radiusMeters || 75,
            })),
          );
        }
      }
    } catch (_) {}
  }, [accessToken]);

  useEffect(() => {
    fetchClassrooms();
  }, [fetchClassrooms]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = accessToken || localStorage.getItem('access_token');
    const payload = {
      name: newName,
      building: newBuilding,
      latitude: parseFloat(newLat),
      longitude: parseFloat(newLng),
      radiusMeters: newRadius,
    };

    let createdId = String(Date.now());
    try {
      const res = await fetch('http://localhost:3000/api/v1/admin/classrooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.id) createdId = data.id;
      }
    } catch (_) {}

    const item: ClassroomItem = {
      id: createdId,
      name: newName,
      building: newBuilding,
      latitude: parseFloat(newLat),
      longitude: parseFloat(newLng),
      radius: newRadius,
    };
    setClassrooms((prev) => [...prev, item]);
    setShowAddModal(false);
    setNewName('');
    setNewBuilding('');
  };

  const handleDelete = async (id: string) => {
    try {
      const token = accessToken || localStorage.getItem('access_token');
      await fetch(`http://localhost:3000/api/v1/admin/classrooms/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (_) {}
    setClassrooms((prev) => prev.filter((c) => c.id !== id));
  };

  const filtered = classrooms.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.building.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Classrooms & Geofence Coordinates</h1>
          <p className="text-sm text-slate-400 mt-1">
            Define classroom GPS geofence anchors and maximum allowed radius
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-semibold text-slate-950 hover:bg-brand-400 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Geofence Zone</span>
        </button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search classroom or building..."
            className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2 pl-10 pr-4 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />
        </div>
        <div className="text-xs text-slate-400">{filtered.length} Classrooms Active</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((room) => (
          <div key={room.id} className="glass-panel glass-panel-hover rounded-2xl p-6 relative group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-white">{room.name}</span>
              <div className="flex items-center space-x-2">
                <span className="flex items-center space-x-1 text-[11px] font-semibold text-brand-400 bg-brand-500/10 px-2.5 py-0.5 rounded-full border border-brand-500/20">
                  <Shield className="h-3 w-3" />
                  <span>{room.radius || room.radiusMeters || 75}m Radius</span>
                </span>
                <button
                  onClick={() => handleDelete(room.id)}
                  title="Remove Classroom Geofence"
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-400 mb-4">{room.building}</div>

            <div className="pt-4 border-t border-slate-800 text-xs font-mono space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Latitude:</span>
                <span>{room.latitude}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Longitude:</span>
                <span>{room.longitude}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4">Add Classroom Geofence</h3>
            <form onSubmit={handleAdd} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Room Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2 px-3 text-white"
                  placeholder="e.g. Room 501"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Building</label>
                <input
                  type="text"
                  required
                  value={newBuilding}
                  onChange={(e) => setNewBuilding(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2 px-3 text-white"
                  placeholder="e.g. Academic Block B"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Latitude</label>
                  <input
                    type="text"
                    required
                    value={newLat}
                    onChange={(e) => setNewLat(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2 px-3 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Longitude</label>
                  <input
                    type="text"
                    required
                    value={newLng}
                    onChange={(e) => setNewLng(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2 px-3 text-white font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Geofence Radius ({newRadius} meters)</label>
                <input
                  type="range"
                  min="25"
                  max="150"
                  step="5"
                  value={newRadius}
                  onChange={(e) => setNewRadius(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl px-4 py-2 text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-brand-500 px-4 py-2 font-semibold text-slate-950 hover:bg-brand-400"
                >
                  Save Geofence
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
