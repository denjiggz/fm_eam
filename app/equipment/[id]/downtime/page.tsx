'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface DowntimeRecord {
  id: string;
  reason: string;
  startDate: string;
  endDate: string | null;
  durationHours: number | null;
  ticket?: {
    id: string;
    ticketNumber: string;
  };
}

export default function DowntimeRecordsPage({ params }: { params: { id: string } }) {
  const [records, setRecords] = useState<DowntimeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    reason: '',
    startDate: new Date().toISOString().slice(0, 16),
    endDate: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchRecords();
  }, [params.id]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/equipment/${params.id}/downtime`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setRecords(data.records || []);
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Error', description: 'Failed to load downtime records' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        reason: formData.reason,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
      };

      const response = await fetch(`/api/equipment/${params.id}/downtime`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to create');

      toast({ title: 'Success', description: 'Downtime record created' });
      setFormData({
        reason: '',
        startDate: new Date().toISOString().slice(0, 16),
        endDate: '',
      });
      setShowForm(false);
      fetchRecords();
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Error', description: 'Failed to create downtime record' });
    }
  };

  const formatDuration = (hours: number | null) => {
    if (!hours) return '-';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}ч ${m}м`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-UZ');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Простои оборудования</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Закрыть' : '+ Добавить простой'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Причина</label>
              <input
                type="text"
                placeholder="Причина простоя"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Начало</label>
              <input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Окончание</label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          </div>
          <Button type="submit" className="w-full">Сохранить</Button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-8">Загрузка...</div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Причина</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Начало</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Окончание</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">Длительность</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Тикет</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3">{record.reason}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">
                    {formatDate(record.startDate)}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">
                    {record.endDate ? formatDate(record.endDate) : 'Текущий'}
                  </td>
                  <td className="px-6 py-3 text-right font-mono">
                    {formatDuration(record.durationHours)}
                  </td>
                  <td className="px-6 py-3">
                    {record.ticket ? (
                      <span className="text-blue-600 font-mono">{record.ticket.ticketNumber}</span>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {records.length === 0 && (
            <div className="text-center py-8 text-gray-500">Нет записей о простоях</div>
          )}
        </div>
      )}
    </div>
  );
}
