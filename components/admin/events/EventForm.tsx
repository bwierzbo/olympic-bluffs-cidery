'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import type { AdminEventDTO, EventInput } from '@/lib/events/types';
import {
  apiFetch,
  cardClass,
  helpClass,
  inputClass,
  labelClass,
  primaryButton,
  useApiError,
} from '@/app/admin/events/_shared';
import { isoToPacific, pacificToIso } from './pacific';
import { ApiError } from '@/app/admin/newsletter/_shared';

interface FarmImage {
  src: string;
  label: string;
}

/** Form fields as the inputs hold them (strings), converted to EventInput on save. */
interface FormValues {
  title: string;
  description: string;
  image: string | null;
  imageAlt: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  capacity: string;
  price: string;
  maxSeatsPerOrder: string;
  requires21: boolean;
  waitlistEnabled: boolean;
  /** datetime-local value, Pacific */
  registrationClosesAt: string;
  refundPolicy: string;
}

const LOCATION_SUGGESTIONS = ['The cidery', 'The orchard', 'The fields', 'The lavender boutique', 'Salt & Cedar'];

const EMPTY_VALUES: FormValues = {
  title: '',
  description: '',
  image: null,
  imageAlt: '',
  date: '',
  startTime: '',
  endTime: '',
  location: '',
  capacity: '12',
  price: '0',
  maxSeatsPerOrder: '4',
  requires21: false,
  waitlistEnabled: true,
  registrationClosesAt: '',
  refundPolicy: '',
};

function valuesFromEvent(event: AdminEventDTO | null): FormValues {
  if (!event) return EMPTY_VALUES;
  const start = isoToPacific(event.startsAt);
  const end = isoToPacific(event.endsAt);
  const closes = isoToPacific(event.registrationClosesAt);
  return {
    title: event.title,
    description: event.description,
    image: event.image,
    imageAlt: event.imageAlt ?? '',
    date: start.date,
    startTime: start.time,
    endTime: end.time,
    location: event.location,
    capacity: String(event.capacity),
    price: event.pricePerSeat % 100 === 0 ? String(event.pricePerSeat / 100) : (event.pricePerSeat / 100).toFixed(2),
    maxSeatsPerOrder: String(event.maxSeatsPerOrder),
    requires21: event.requires21,
    waitlistEnabled: event.waitlistEnabled,
    registrationClosesAt: closes.date ? `${closes.date}T${closes.time}` : '',
    refundPolicy: event.refundPolicy ?? '',
  };
}

function sameValues(a: FormValues, b: FormValues): boolean {
  return (Object.keys(a) as (keyof FormValues)[]).every((k) => a[k] === b[k]);
}

function parseWholeNumber(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) return null;
  return Number(value.trim());
}

/** Validates and converts; returns an error message instead when something is off. */
function toEventInput(v: FormValues): { input: EventInput } | { error: string } {
  if (!v.title.trim()) return { error: 'Give the event a title.' };
  if (!v.date || !v.startTime || !v.endTime) return { error: 'Set the date, start time and end time.' };
  if (v.endTime <= v.startTime) return { error: 'The end time needs to be after the start time.' };
  const startsAt = pacificToIso(v.date, v.startTime);
  const endsAt = pacificToIso(v.date, v.endTime);
  if (!startsAt || !endsAt) return { error: 'The date or times look invalid.' };

  const capacity = parseWholeNumber(v.capacity);
  if (capacity === null || capacity < 1) return { error: 'Capacity needs to be at least 1.' };
  const maxSeats = parseWholeNumber(v.maxSeatsPerOrder);
  if (maxSeats === null || maxSeats < 1) return { error: 'Max seats per order needs to be at least 1.' };
  if (maxSeats > capacity) return { error: 'Max seats per order can’t be more than the capacity.' };

  const priceText = v.price.trim().replace(/^\$/, '');
  if (!/^\d+(\.\d{1,2})?$/.test(priceText)) return { error: 'Enter the price in dollars, like 45 or 12.50.' };
  const pricePerSeat = Math.round(Number(priceText) * 100);

  let registrationClosesAt: string | null = null;
  if (v.registrationClosesAt) {
    const [closeDate, closeTime] = v.registrationClosesAt.split('T');
    registrationClosesAt = pacificToIso(closeDate ?? '', (closeTime ?? '').slice(0, 5));
    if (!registrationClosesAt) return { error: 'The registration close time looks invalid.' };
    if (registrationClosesAt > startsAt) return { error: 'Registration needs to close before the event starts.' };
  }

  return {
    input: {
      title: v.title.trim(),
      description: v.description.trim(),
      image: v.image,
      imageAlt: v.image ? v.imageAlt.trim() || null : null,
      startsAt,
      endsAt,
      location: v.location.trim(),
      capacity,
      pricePerSeat,
      maxSeatsPerOrder: maxSeats,
      requires21: v.requires21,
      waitlistEnabled: v.waitlistEnabled,
      registrationClosesAt,
      refundPolicy: v.refundPolicy.trim() || null,
    },
  };
}

interface EventFormProps {
  /** null in create mode */
  event: AdminEventDTO | null;
  /** Saves the input; resolves to an error message, or null on success. */
  onSave: (input: EventInput) => Promise<string | null>;
  onDirtyChange?: (dirty: boolean) => void;
  /** Read-only, e.g. for a cancelled event. */
  readOnly?: boolean;
}

export default function EventForm({ event, onSave, onDirtyChange, readOnly = false }: EventFormProps) {
  const handleError = useApiError();
  const [baseline, setBaseline] = useState<FormValues>(() => valuesFromEvent(event));
  const [values, setValues] = useState<FormValues>(baseline);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<FarmImage[] | null>(null);
  const [imagesError, setImagesError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Upload a photo to the site's photo storage and select it for this event.
  // The file input only accepts JPG/PNG/WebP; iPhones convert HEIC photos to
  // JPEG automatically when the input doesn't allow HEIC.
  async function uploadPhoto(file: File) {
    setUploading(true);
    setUploadError(null);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/admin/events/upload', { method: 'POST', body });
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (res.status === 401) {
        setUploadError(handleError(new ApiError(401, 'Your session has expired. Please log in again.')));
        return;
      }
      if (!res.ok || !data?.url) {
        setUploadError(data?.error || `Upload failed (error ${res.status}). Please try again.`);
        return;
      }
      const url = data.url;
      setImages((prev) => [{ src: url, label: 'Uploaded photo' }, ...(prev ?? [])]);
      update('image', url);
    } catch {
      setUploadError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  const isCreate = event === null;
  const dirty = !sameValues(values, baseline);

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ images: FarmImage[] }>('/api/admin/events/images')
      .then((data) => {
        if (!cancelled) setImages(data.images);
      })
      .catch((err) => {
        if (!cancelled) setImagesError(handleError(err));
      });
    return () => {
      cancelled = true;
    };
  }, [handleError]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  const update = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    const next = { ...values, [key]: value };
    setValues(next);
    setError(null);
    onDirtyChange?.(!sameValues(next, baseline));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = toEventInput(values);
    if ('error' in result) {
      setError(result.error);
      return;
    }
    setSaving(true);
    setError(null);
    const saveError = await onSave(result.input);
    setSaving(false);
    if (saveError) {
      setError(saveError);
      return;
    }
    setBaseline(values);
    onDirtyChange?.(false);
  };

  const imageOptions: FarmImage[] = images ? [...images] : [];
  if (values.image && images && !images.some((img) => img.src === values.image)) {
    imageOptions.unshift({ src: values.image, label: 'Current image' });
  }

  const pricePreview = /^\$?\d+(\.\d{1,2})?$/.test(values.price.trim()) && Number(values.price.replace('$', '')) === 0;

  const imageButtonClass = (selected: boolean) =>
    `relative aspect-[4/3] rounded-md overflow-hidden border-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 ${
      selected ? 'border-sage-600 ring-2 ring-sage-600' : 'border-transparent hover:border-gray-300'
    }`;

  return (
    <form onSubmit={handleSubmit} noValidate className={`${cardClass} p-4 sm:p-6`}>
      <fieldset disabled={readOnly || saving} className="space-y-6 min-w-0">
        <legend className="sr-only">Event details</legend>

        <div>
          <label htmlFor="event-title" className={labelClass}>
            Title
          </label>
          <input
            id="event-title"
            type="text"
            value={values.title}
            onChange={(e) => update('title', e.target.value)}
            className={inputClass}
            placeholder="Lavender wreath workshop"
            required
          />
        </div>

        <div>
          <label htmlFor="event-description" className={labelClass}>
            Description
          </label>
          <textarea
            id="event-description"
            value={values.description}
            onChange={(e) => update('description', e.target.value)}
            className={`${inputClass} min-h-[8rem]`}
            rows={6}
            aria-describedby="event-description-help"
          />
          <p id="event-description-help" className={helpClass}>
            Leave a blank line between paragraphs.
          </p>
        </div>

        <div>
          <span id="event-image-label" className={labelClass}>
            Image
          </span>
          {imagesError && <p className="text-sm text-red-700 mb-2">{imagesError}</p>}
          {uploadError && (
            <p className="text-sm text-red-700 mb-2" role="alert">
              {uploadError}
            </p>
          )}
          {images === null && !imagesError && <p className="text-sm text-gray-500">Loading farm photos...</p>}
          {images !== null && (
            <div
              role="radiogroup"
              aria-labelledby="event-image-label"
              className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2"
            >
              <label
                className={`${imageButtonClass(false)} flex cursor-pointer flex-col items-center justify-center gap-1 border-dashed bg-white text-center ${
                  uploading || readOnly ? 'pointer-events-none opacity-60' : 'hover:bg-gray-50'
                }`}
              >
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  disabled={uploading || readOnly}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (file) void uploadPhoto(file);
                  }}
                />
                <span aria-hidden="true" className="text-xl leading-none text-gray-500">
                  +
                </span>
                <span className="px-1 text-xs font-medium text-gray-700">
                  {uploading ? 'Uploading…' : 'Upload a photo'}
                </span>
              </label>
              <button
                type="button"
                role="radio"
                aria-checked={values.image === null}
                onClick={() => update('image', null)}
                className={`${imageButtonClass(values.image === null)} bg-gray-100 flex items-center justify-center`}
              >
                <span className="text-sm text-gray-600">No image</span>
              </button>
              {imageOptions.map((img) => (
                <button
                  key={img.src}
                  type="button"
                  role="radio"
                  aria-checked={values.image === img.src}
                  aria-label={img.label}
                  title={img.label}
                  onClick={() => update('image', img.src)}
                  className={`${imageButtonClass(values.image === img.src)} bg-gray-100`}
                >
                  <Image
                    src={img.src}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 12rem, (min-width: 640px) 25vw, 33vw"
                    className="object-cover"
                    unoptimized={img.src.startsWith('http') && !img.src.includes('.public.blob.vercel-storage.com')}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {values.image && (
          <div>
            <label htmlFor="event-image-alt" className={labelClass}>
              Image alt text
            </label>
            <input
              id="event-image-alt"
              type="text"
              value={values.imageAlt}
              onChange={(e) => update('imageAlt', e.target.value)}
              className={inputClass}
              placeholder="Describe the photo for people using screen readers"
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="event-date" className={labelClass}>
              Date
            </label>
            <input
              id="event-date"
              type="date"
              value={values.date}
              onChange={(e) => update('date', e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label htmlFor="event-start" className={labelClass}>
              Start time
            </label>
            <input
              id="event-start"
              type="time"
              value={values.startTime}
              onChange={(e) => update('startTime', e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label htmlFor="event-end" className={labelClass}>
              End time
            </label>
            <input
              id="event-end"
              type="time"
              value={values.endTime}
              onChange={(e) => update('endTime', e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <p className={`${helpClass} sm:col-span-3 -mt-2`}>Pacific time.</p>
        </div>

        <div>
          <label htmlFor="event-location" className={labelClass}>
            Location on the farm
          </label>
          <input
            id="event-location"
            type="text"
            list="event-location-suggestions"
            value={values.location}
            onChange={(e) => update('location', e.target.value)}
            className={inputClass}
            placeholder="The cidery"
          />
          <datalist id="event-location-suggestions">
            {LOCATION_SUGGESTIONS.map((loc) => (
              <option key={loc} value={loc} />
            ))}
          </datalist>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="event-capacity" className={labelClass}>
              Capacity
            </label>
            <input
              id="event-capacity"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={values.capacity}
              onChange={(e) => update('capacity', e.target.value)}
              className={inputClass}
              aria-describedby="event-capacity-help"
            />
            <p id="event-capacity-help" className={helpClass}>
              Total seats.
            </p>
          </div>
          <div>
            <label htmlFor="event-price" className={labelClass}>
              Price per seat ($)
            </label>
            <input
              id="event-price"
              type="text"
              inputMode="decimal"
              value={values.price}
              onChange={(e) => update('price', e.target.value)}
              className={inputClass}
              aria-describedby="event-price-help"
            />
            <p id="event-price-help" className={helpClass}>
              {pricePreview ? 'Free: people RSVP, no card needed.' : '0 = free, no card needed.'}
            </p>
          </div>
          <div>
            <label htmlFor="event-max-seats" className={labelClass}>
              Max seats per order
            </label>
            <input
              id="event-max-seats"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={values.maxSeatsPerOrder}
              onChange={(e) => update('maxSeatsPerOrder', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <input
              id="event-requires21"
              type="checkbox"
              checked={values.requires21}
              onChange={(e) => update('requires21', e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-sage-600 focus:ring-sage-500"
              aria-describedby="event-requires21-help"
            />
            <div>
              <label htmlFor="event-requires21" className="text-sm font-medium text-gray-700">
                21+ only
              </label>
              <p id="event-requires21-help" className="text-xs text-gray-500">
                Asks for date of birth.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <input
              id="event-waitlist"
              type="checkbox"
              checked={values.waitlistEnabled}
              onChange={(e) => update('waitlistEnabled', e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-sage-600 focus:ring-sage-500"
              aria-describedby="event-waitlist-help"
            />
            <div>
              <label htmlFor="event-waitlist" className="text-sm font-medium text-gray-700">
                Waitlist when full
              </label>
              <p id="event-waitlist-help" className="text-xs text-gray-500">
                People can leave their name once it sells out.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="event-closes" className={labelClass}>
              Registration closes <span className="font-normal text-gray-500">(optional)</span>
            </label>
            <input
              id="event-closes"
              type="datetime-local"
              value={values.registrationClosesAt}
              onChange={(e) => update('registrationClosesAt', e.target.value)}
              className={inputClass}
              aria-describedby="event-closes-help"
            />
            <p id="event-closes-help" className={helpClass}>
              Pacific time. Leave blank to keep registration open until the event starts.
            </p>
          </div>
          <div>
            <label htmlFor="event-refund-policy" className={labelClass}>
              Refund policy
            </label>
            <input
              id="event-refund-policy"
              type="text"
              value={values.refundPolicy}
              onChange={(e) => update('refundPolicy', e.target.value)}
              className={inputClass}
              placeholder="Full refund up to 48 hours before."
            />
          </div>
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="mt-6 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {!readOnly && (
        <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
          <p className="text-sm text-gray-500" aria-live="polite">
            {saving ? 'Saving...' : dirty ? 'Unsaved changes' : isCreate ? '' : 'All changes saved'}
          </p>
          <button type="submit" disabled={saving || (!dirty && !isCreate)} className={primaryButton}>
            {saving ? 'Saving...' : isCreate ? 'Create draft' : 'Save changes'}
          </button>
        </div>
      )}
    </form>
  );
}
