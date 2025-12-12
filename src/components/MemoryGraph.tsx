import { useEffect, useState, useRef } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import axios from 'axios';
import { API_BASE_URL, getUserId } from '../types';

export default function MemoryGraph() {
    const [graphData, setGraphData] = useState<{ nodes: any[], links: any[] }>({ nodes: [], links: [] });
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ w: 600, h: 400 });

    useEffect(() => {
        if (containerRef.current) {
            setDimensions({
                w: containerRef.current.clientWidth,
                h: containerRef.current.clientHeight
            });
        }

        const fetchData = async () => {
            const userId = getUserId();
            try {
                // Fetch data for graph
                const [docsRes, tasksRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/documents/list?userId=${userId}`).catch(() => ({ data: [] })),
                    axios.get(`${API_BASE_URL}/task?userId=${userId}`).catch(() => ({ data: [] })),
                    // axios.get(`${API_BASE_URL}/memory?userId=${userId}`).catch(() => ({ data: { semantic: [] } })) 
                    // Memory endpoint might not be exposed directly in gateway? Check index.ts. 
                    // Correct, gateway doesn't expose GET /memory directly in Step 2276. It exposes /assistant/briefing.
                    // But wait, Step 2286 test script uses /chat to get memory? No.
                    // Let's rely on Docs and Tasks for now to be safe, or use what we have.
                ]);

                const nodes: any[] = [];
                const links: any[] = [];

                // Central Node
                nodes.push({ id: 'Brain', name: 'Second Brain', val: 20, color: '#ffffff' });

                // Documents
                if (Array.isArray(docsRes.data)) {
                    docsRes.data.forEach((d: any) => {
                        const id = `doc-${d.fileId || d.name}`;
                        nodes.push({ id, name: d.name, group: 'doc', val: 8, color: '#6366f1' }); // Indigo
                        links.push({ source: 'Brain', target: id });
                    });
                }

                // Tasks
                if (Array.isArray(tasksRes.data)) {
                    tasksRes.data.forEach((t: any) => {
                        const id = `task-${t.id}`;
                        nodes.push({ id, name: t.title, group: 'task', val: 5, color: '#10b981' }); // Emerald
                        links.push({ source: 'Brain', target: id });
                    });
                }

                setGraphData({ nodes, links });

            } catch (e) {
                console.error("Graph fetch failed", e);
            }
        };

        fetchData();
    }, []);

    return (
        <div ref={containerRef} className="w-full h-full min-h-[300px] bg-black/20 rounded-xl overflow-hidden">
            <ForceGraph3D
                graphData={graphData}
                width={dimensions.w}
                height={dimensions.h}
                nodeLabel="name"
                nodeColor="color"
                nodeVal="val"
                backgroundColor="rgba(0,0,0,0)"
                linkOpacity={0.2}
                linkWidth={1}
                nodeResolution={16}
            />
        </div>
    );
}
