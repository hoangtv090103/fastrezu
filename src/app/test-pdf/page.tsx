'use client';

import { useState } from 'react';
import { shortCV, mediumCV, longCV } from '@/lib/test-pdf-export';
import { CVData } from '@/contexts/CVEditorContext';

/**
 * Manual test page for PDF export quality
 * 
 * Access at: /test-pdf
 * 
 * This page allows testing PDF export with different CV lengths:
 * - Short CV (1 page)
 * - Medium CV (1.5 pages)
 * - Long CV (2+ pages)
 */
export default function TestPDFPage() {
  const [selectedCV, setSelectedCV] = useState<'short' | 'medium' | 'long'>('short');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cvDataMap: Record<'short' | 'medium' | 'long', CVData> = {
    short: shortCV,
    medium: mediumCV,
    long: longCV
  };

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);

    try {
      const cvData = cvDataMap[selectedCV];
      
      const response = await fetch('/api/cv/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cvData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to export PDF');
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `test-${selectedCV}-cv.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">PDF Export Quality Test</h1>
        <p className="text-gray-600 mb-8">
          Test PDF export with different CV lengths to verify page breaks and text selectability
        </p>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Select CV Length</h2>
          
          <div className="space-y-4">
            <label className="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="cv-length"
                value="short"
                checked={selectedCV === 'short'}
                onChange={(e) => setSelectedCV(e.target.value as 'short')}
                className="mt-1 mr-3"
              />
              <div>
                <div className="font-semibold">Short CV (1 page)</div>
                <div className="text-sm text-gray-600">
                  Basic information with 1 experience entry, 1 education entry, minimal skills
                </div>
              </div>
            </label>

            <label className="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="cv-length"
                value="medium"
                checked={selectedCV === 'medium'}
                onChange={(e) => setSelectedCV(e.target.value as 'medium')}
                className="mt-1 mr-3"
              />
              <div>
                <div className="font-semibold">Medium CV (1.5 pages)</div>
                <div className="text-sm text-gray-600">
                  2 experience entries with multiple achievements, 2 education entries, projects, certifications
                </div>
              </div>
            </label>

            <label className="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="cv-length"
                value="long"
                checked={selectedCV === 'long'}
                onChange={(e) => setSelectedCV(e.target.value as 'long')}
                className="mt-1 mr-3"
              />
              <div>
                <div className="font-semibold">Long CV (2+ pages)</div>
                <div className="text-sm text-gray-600">
                  4 experience entries with detailed achievements, 2 education entries, 4 projects, 4 certifications
                </div>
              </div>
            </label>
          </div>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="mt-6 w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isExporting ? 'Exporting...' : 'Export to PDF'}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test Checklist</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">✓ Page Break Quality</h3>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>Experience entries are not split across pages</li>
                <li>Education entries are not split across pages</li>
                <li>Project items are not split across pages</li>
                <li>Certification items are not split across pages</li>
                <li>Section headers stay with their content (no orphaned headers)</li>
                <li>Achievement bullets stay with their parent section</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">✓ Text Selectability</h3>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>All text in the PDF is selectable</li>
                <li>Text can be copied from the PDF</li>
                <li>Text maintains proper formatting when copied</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">✓ Visual Quality</h3>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>Professional appearance with proper spacing</li>
                <li>Consistent formatting throughout</li>
                <li>No overlapping text or elements</li>
                <li>Proper margins on all pages</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 mb-2">
            <strong>Note:</strong> After exporting, open the PDF and verify all items in the checklist above.
            Test with all three CV lengths to ensure page breaks work correctly for different content amounts.
          </p>
          <p className="text-sm text-blue-800">
            <strong>Text Selectability Test:</strong> Open the exported PDF, try to select text with your cursor,
            and copy-paste it into a text editor. All text should be selectable and copyable without issues.
          </p>
        </div>
      </div>
    </div>
  );
}
