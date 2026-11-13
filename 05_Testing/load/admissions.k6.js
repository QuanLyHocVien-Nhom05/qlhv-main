// Run only against an authorized isolated load-test environment.
// k6 run -e BASE_URL=https://test.example.edu/api -e VUS=20 admissions.k6.js
import http from 'k6/http';
import {check,sleep} from 'k6';
const target=Number(__ENV.VUS||20);
export const options={stages:[{duration:__ENV.RAMP_UP||'1m',target},{duration:__ENV.DURATION||'5m',target},{duration:__ENV.RAMP_DOWN||'30s',target:0}],thresholds:{http_req_failed:['rate<0.01'],http_req_duration:['p(95)<1500']},summaryTrendStats:['avg','p(90)','p(95)','p(99)','max']};
export default function(){
 const response=http.get((__ENV.BASE_URL||'http://127.0.0.1:3001/api')+'/public/admission-options');
 check(response,{'public options respond successfully':r=>r.status===200});sleep(1);
}
