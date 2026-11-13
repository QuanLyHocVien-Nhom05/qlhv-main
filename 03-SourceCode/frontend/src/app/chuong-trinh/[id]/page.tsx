import { PublicProgramDetail } from '@/features/public/public-programs';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <PublicProgramDetail id={id}/>;}
