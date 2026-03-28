import { createClient } from '@/lib/supabase/server';
import { getProjectReportData } from '@/lib/supabase/queries/assessments';
import ProjectReportClient from './ProjectReportClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ProjectReportPageProps {
    params: {
        studentId: string;
        projectId: string;
    };
}

export default async function ProjectReportPage({ params }: ProjectReportPageProps) {
    const { studentId, projectId } = await params;
    const supabase = await createClient();
    
    try {
        const data = await getProjectReportData(supabase, studentId, projectId);
        
        return (
            <ProjectReportClient 
                student={data.student}
                project={data.project}
                domains={data.domains}
                assessments={data.assessments}
                peerSummary={data.peerSummary}
                notes={data.notes}
            />
        );
    } catch (error) {
        console.error('Error loading project report:', error);
        return notFound();
    }
}
