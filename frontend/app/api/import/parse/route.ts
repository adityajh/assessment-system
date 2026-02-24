import { NextRequest, NextResponse } from 'next/server';
import * as xlsx from 'xlsx';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const type = formData.get('type') as string;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Parse excel file
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const sheetNames = workbook.SheetNames;

        // Convert all sheets to JSON for the preview
        const sheetsData: Record<string, any[]> = {};

        sheetNames.forEach(name => {
            const sheet = workbook.Sheets[name];
            // Use header: 1 to get array of arrays (preserves original layout better for some forms)
            sheetsData[name] = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });
        });

        return NextResponse.json({
            success: true,
            filename: file.name,
            sheetNames,
            sheetsData,
            detectedType: detectFileType(file.name, sheetNames)
        });

    } catch (error: any) {
        console.error('File parsing error:', error);
        return NextResponse.json(
            { error: `Failed to parse Excel file: ${error.message}` },
            { status: 500 }
        );
    }
}

function detectFileType(filename: string, sheetNames: string[]): string {
    const nameLower = filename.toLowerCase();

    if (nameLower.includes('matrix') || sheetNames.includes('Kickstart') || sheetNames.includes('SDP')) {
        return 'mentor';
    }
    if (nameLower.includes('self') || nameLower.includes('x-ray') || nameLower.includes('accounting')) {
        return 'self';
    }
    if (nameLower.includes('peer')) {
        return 'peer';
    }
    if (nameLower.includes('term') || nameLower.includes('cbp')) {
        return 'term';
    }

    return 'unknown';
}
