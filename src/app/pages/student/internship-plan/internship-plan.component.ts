import { Component } from '@angular/core';

interface WeekPlan {
  weekNumber: number;
  tasks: string;
  expectedResults: string;
  evidences: string;
  clos: number[];
}

@Component({
  selector: 'app-internship-plan',
  templateUrl: './internship-plan.component.html',
  styleUrls: ['./internship-plan.component.scss']
})
export class InternshipPlanComponent {
  status = {
    label: 'Chờ duyệt',
    message: 'GVHD/ĐVHD chưa duyệt'
  };

  availableClos = [1, 2, 3, 4, 5, 6, 7];

  weeks: WeekPlan[] = [
    { weekNumber: 1, tasks: '', expectedResults: '', evidences: '', clos: [] },
    { weekNumber: 2, tasks: '', expectedResults: '', evidences: '', clos: [] },
    { weekNumber: 3, tasks: '', expectedResults: '', evidences: '', clos: [] },
    { weekNumber: 4, tasks: '', expectedResults: '', evidences: '', clos: [] },
    { weekNumber: 5, tasks: '', expectedResults: '', evidences: '', clos: [] },
    { weekNumber: 6, tasks: '', expectedResults: '', evidences: '', clos: [] },
    { weekNumber: 7, tasks: '', expectedResults: '', evidences: '', clos: [] },
    { weekNumber: 8, tasks: '', expectedResults: '', evidences: '', clos: [] }
  ];

  toggleClo(week: WeekPlan, clo: number) {
    const index = week.clos.indexOf(clo);
    if (index > -1) {
      week.clos.splice(index, 1);
    } else {
      week.clos.push(clo);
    }
  }

  hasClo(week: WeekPlan, clo: number): boolean {
    return week.clos.includes(clo);
  }
}

