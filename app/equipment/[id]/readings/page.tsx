'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface EquipmentReading {
  id: string;
  paramName: string;
  paramValue: number;
  unit: string;
  recordedAt: string;
}

interface EquipmentReadingThreshold {
  id: string;
  paramName: string;
  minValue?: number;
  maxValue?: number;
  unit: string;
}

export default function EquipmentReadingsPage({ params }: { params: { id: string } }) {
  const [readings, setReadings] = useState<EquipmentReading[]>([]);
  const [thresholds, setThresholds] = useState<EquipmentReadingThreshold[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReadingForm, setShowReadingForm] = useState(false);
  const [showThresholdForm, setShowThresholdForm] = useState(false);
  const [readingData, setReadingData] = useState({
    paramName: '',
    paramValue: 0,
    unit: '',
  });
  const [thresholdData, setThresholdData] = useState({
    paramName: '',
    minValue: 0,
    maxValue: 0,
    unit: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [readingsRes, thresholdsRes] = await Promise.all([
        fetch(`/api/equipment/${params.id}/readings`),
        fetch(`/api/equipment/${params.id}/thresholds`)
      ]);

      if (!readingsRes.ok || !thresholdsRes.ok) throw new Error('Failed to fetch');

      const readingsData = await readingsRes.json();
      const thresholdsData = await thresholdsRes.json();

      setReadings(readingsData.readings || []);
      setThresholds(thresholdsData || []);
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Error', description: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddReading = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/equipment/${params.id}/readings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(readingData),
      });

      if (!response.ok) throw new Error('Failed to create');

      toast({ title: 'Success', description: 'Показание записано' });
      setReadingData({ paramName: '', paramValue: 0, unit: '' });
      setShowReadingForm(false);
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Error', description: 'Failed to add reading' });
    }
  };

  const handleAddThreshold = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/equipment/${params.id}/thresholds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(thresholdData),
      });

      if (!response.ok) throw new Error('Failed to create');

      toast({ title: 'Success', description: 'Порог установлен' });
      setThresholdData({ paramName: '', minValue: 0, maxValue: 0, unit: '' });
      setShowThresholdForm(false);
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Error', description: 'Failed to set threshold' });
    }
  };

  const handleDeleteThreshold = async (paramName: string) => {
    if (!window.confirm('Delete threshold?')) return;

    try {
      const response = await fetch(
        `/api/equipment/${params.id}/thresholds?paramName=${paramName}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to delete');

      toast({ title: 'Success', description: 'Threshold deleted' });
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Error', description: 'Failed to delete threshold' });
    }
  };

  return (
    <div className="space-y-8">
      {/* Readings Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Показания оборудования</h2>
          <Button onClick={() => setShowReadingForm(!showReadingForm)}>
            {showReadingForm ? 'Закрыть' : '+ Добавить показание'}
          </Button>
        </div>

        {showReadingForm && (
          <form onSubmit={handleAddReading} className="bg-white p-6 rounded-lg border mb-4 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Название параметра"
                value={readingData.paramName}
                onChange={(e) => setReadingData({ ...readingData, paramName: e.target.value })}
                required
                className="px-3 py-2 border rounded"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Значение"
                value={readingData.paramValue}
                onChange={(e) => setReadingData({ ...readingData, paramValue: parseFloat(e.target.value) || 0 })}
                required
                className="px-3 py-2 border rounded"
              />
              <input
                type="text"
                placeholder="Единица"
                value={readingData.unit}
                onChange={(e) => setReadingData({ ...readingData, unit: e.target.value })}
                required
                className="px-3 py-2 border rounded"
              />
            </div>
            <Button type="submit" className="w-full">Записать</Button>
          </form>
        )}

        {loading ? (
          <div className="text-center py-8">Загрузка...</div>
        ) : (
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Параметр</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Значение</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Единица</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Дата</th>
                </tr>
              </thead>
              <tbody>
                {readings.map((reading) => (
                  <tr key={reading.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-3">{reading.paramName}</td>
                    <td className="px-6 py-3 text-right font-mono">{reading.paramValue}</td>
                    <td className="px-6 py-3">{reading.unit}</td>
                    <td className="px-6 py-3 text-sm text-gray-500">
                      {new Date(reading.recordedAt).toLocaleString('ru-UZ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {readings.length === 0 && (
              <div className="text-center py-8 text-gray-500">Нет показаний</div>
            )}
          </div>
        )}
      </div>

      {/* Thresholds Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Пороги срабатывания</h2>
          <Button onClick={() => setShowThresholdForm(!showThresholdForm)}>
            {showThresholdForm ? 'Закрыть' : '+ Установить порог'}
          </Button>
        </div>

        {showThresholdForm && (
          <form onSubmit={handleAddThreshold} className="bg-white p-6 rounded-lg border mb-4 space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Название параметра"
                value={thresholdData.paramName}
                onChange={(e) => setThresholdData({ ...thresholdData, paramName: e.target.value })}
                required
                className="px-3 py-2 border rounded"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Минимум"
                value={thresholdData.minValue}
                onChange={(e) => setThresholdData({ ...thresholdData, minValue: parseFloat(e.target.value) || 0 })}
                className="px-3 py-2 border rounded"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Максимум"
                value={thresholdData.maxValue}
                onChange={(e) => setThresholdData({ ...thresholdData, maxValue: parseFloat(e.target.value) || 0 })}
                required
                className="px-3 py-2 border rounded"
              />
              <input
                type="text"
                placeholder="Единица"
                value={thresholdData.unit}
                onChange={(e) => setThresholdData({ ...thresholdData, unit: e.target.value })}
                required
                className="px-3 py-2 border rounded"
              />
            </div>
            <Button type="submit" className="w-full">Установить порог</Button>
          </form>
        )}

        {thresholds.length === 0 ? (
          <div className="bg-white p-6 rounded-lg border text-center text-gray-500">
            Нет установленных порогов
          </div>
        ) : (
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Параметр</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Мин</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Макс</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Единица</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold">Действия</th>
                </tr>
              </thead>
              <tbody>
                {thresholds.map((threshold) => (
                  <tr key={threshold.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-3">{threshold.paramName}</td>
                    <td className="px-6 py-3 text-right font-mono">
                      {threshold.minValue ?? '-'}
                    </td>
                    <td className="px-6 py-3 text-right font-mono">
                      {threshold.maxValue ?? '-'}
                    </td>
                    <td className="px-6 py-3">{threshold.unit}</td>
                    <td className="px-6 py-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteThreshold(threshold.paramName)}
                      >
                        Удалить
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
