import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonButton,
  IonButtons,
  IonBackButton,
  IonNote,
  IonIcon,
  IonFooter
} from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { NavController } from '@ionic/angular';

import { UserCapturePlan } from 'src/app/core/models/user-capture-plan.model';
import { UserCapturePlanService } from 'src/app/core/services/user-capture-plan/user-capture-plan.service';
import { CapturePlan } from 'src/app/core/services/planning/planning-service';
import { UserLocation } from 'src/app/core/models/location.model';
import { CapturePlanContextService } from 'src/app/core/services/capture-plan-context/capture-plan-context.service';
import { DeepSkyObject } from 'src/app/core/models/deep-sky-object.model';
import { TargetCatalogService } from 'src/app/core/services/target-catalog/target-catalog.service';
import { TargetIconPipe } from '../../pipes/target-icon.pipe';

@Component({
  selector: 'app-user-capture-plan-page',
  templateUrl: './user-capture-plan.page.html',
  styleUrls: ['./user-capture-plan.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonButton,
    IonButtons,
    IonBackButton,
    IonNote,
    IonIcon,
    IonFooter,
    TargetIconPipe
  ],
})
export class UserCapturePlanPage implements OnInit {
  form!: FormGroup;
  isEditing = false;

  capturePlan?: CapturePlan;   // recebido via state (no caso de "new")
  userPlanId?: string;         // recebido via param (no caso de "edit")
  target?: DeepSkyObject;
  sessionDate!: Date;
  sessionLocation!: UserLocation;

  // exposições típicas (pode ajustar depois):
  private readonly FLAT_EXPOSURE_SECONDS = 3;   // 3s por flat
  private readonly DARK_FLAT_EXPOSURE_SECONDS = 3; // geralmente igual aos flats
  private readonly BIAS_EXPOSURE_SECONDS = 0.1; // 0.1s por bias

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private nav: NavController,
    private userPlanService: UserCapturePlanService,
    private targetCatalogService: TargetCatalogService,
    private capturePlanContext: CapturePlanContextService
  ) { }

  ngOnInit(): void {
    const lastBortle = this.userPlanService.getLastBortle();

    this.form = this.fb.group({
      notes: [''],
      exposureSeconds: [null, [Validators.required, Validators.min(1)]],
      isoGain: [null],
      filters: [''],
      bortle: [lastBortle ?? null, [Validators.min(1), Validators.max(9)]],
      lights: [null, [Validators.min(0)]],
      darks: [null, [Validators.min(0)]],
      flats: [null, [Validators.min(0)]],
      biases: [null, [Validators.min(0)]],
      darkFlats: [null, [Validators.min(0)]],
    });
  }

  ionViewWillEnter() {
    this.loadFromRoute();
  }

  private loadFromRoute(): void {
    const lastBortle = this.userPlanService.getLastBortle();

    this.isEditing = false;
    this.capturePlan = undefined;
    this.userPlanId = this.route.snapshot.paramMap.get('id') ?? undefined;

    const cp = this.capturePlanContext.getPlan();
    if (!cp) {
      this.nav.back();
      return;
    }
    this.capturePlan = cp;

    // modo edição: /plan/:id
    if (this.userPlanId) {
      const existing = this.userPlanService.getById(this.userPlanId);
      if (!existing) {
        this.nav.back();
        return;
      }

      this.isEditing = true;

      this.target = this.targetCatalogService.getById(cp.targetId || '');
      this.sessionDate = new Date(existing.date);
      this.sessionLocation = existing.location ?? undefined;

      this.form.reset({
        notes: existing.notes ?? '',
        exposureSeconds: existing.exposureSeconds,
        isoGain: existing.isoGain ?? null,
        filters: existing.filters ?? '',
        bortle: existing.bortle ?? lastBortle ?? null,
        lights: existing.lights ?? null,
        darks: existing.darks ?? null,
        flats: existing.flats ?? null,
        biases: existing.biases ?? null,
        darkFlats: existing.darkFlats ?? null,
      });

      return;
    }

    // Ajusta de acordo com a estrutura real do seu CapturePlan
    this.target = this.targetCatalogService.getById(cp.targetId || '');
    this.sessionDate = cp.date ?? this.todayISO();
    this.sessionLocation = cp.location;

    this.form.reset({
      notes: '',
      exposureSeconds: null,
      isoGain: null,
      filters: '',
      bortle: lastBortle ?? null,
      lights: null,
      darks: null,
      flats: null,
      biases: null,
      darkFlats: null,
    });
  }

  // -------------------------
  // Helpers
  // -------------------------
  get f() { return this.form.controls; }

  private todayISO(): string {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }

  private num(v: any): number {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  }

  get totalIntegrationSeconds(): number {
    const lights = this.num(this.f['lights'].value);
    const exposure = this.num(this.f['exposureSeconds'].value);
    return lights * exposure;
  }

  get totalIntegrationLabel(): string {
    const minutes = this.totalIntegrationSeconds / 60;
    if (!minutes) return '—';
    return this.formatMinutes(minutes);
  }

  get estimatedSessionMinutes(): number {
    const exposure = this.num(this.f['exposureSeconds'].value); // exposição dos lights/darks
    if (!exposure) return 0;

    const lights = this.num(this.f['lights'].value);
    const darks = this.num(this.f['darks'].value);
    const flats = this.num(this.f['flats'].value);
    const biases = this.num(this.f['biases'].value);
    const darkFlats = this.num(this.f['darkFlats'].value);

    // Lights e darks usam a exposição informada
    const lightsMinutes = ((lights * exposure) / 60) * 1.1; // + 10% devido a intervalo entre frames e dithering
    const darksMinutes = (darks * exposure) / 60 * 1.05; // + 5% devido a intervalo entre frames

    // Flats / dark flats / biases usam tempos típicos menores
    const flatsMinutes = (flats * this.FLAT_EXPOSURE_SECONDS) / 60;
    const darkFlatsMinutes = (darkFlats * this.DARK_FLAT_EXPOSURE_SECONDS) / 60;
    const biasesMinutes = (biases * this.BIAS_EXPOSURE_SECONDS) / 60;

    const captureMinutes =
      lightsMinutes +
      darksMinutes +
      flatsMinutes +
      darkFlatsMinutes +
      biasesMinutes;

    const setupMinutes = 30; // média 30min de setup

    return captureMinutes + setupMinutes;
  }

  get estimatedSessionLabel(): string {
    if (!this.estimatedSessionMinutes) return '—';
    return this.formatMinutes(this.estimatedSessionMinutes);
  }

  private formatMinutes(totalMinutes: number): string {
    const rounded = Math.round(totalMinutes);
    const hours = Math.floor(rounded / 60);
    const minutes = rounded % 60;

    if (!hours) return `${minutes} min`;
    if (!minutes) return `${hours} h`;
    return `${hours} h ${minutes} min`;
  }

  // -------------------------
  // Salvar
  // -------------------------
  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // precisa ter targetId de algum lugar
    const targetId =
      this.capturePlan?.targetId ??
      this.userPlanService.getById(this.userPlanId!)?.targetId;

    if (!targetId) {
      // sem targetId não faz sentido o plano
      this.nav.back();
      return;
    }

    const value = this.form.value;

    const plan: UserCapturePlan = {
      id: this.isEditing && this.userPlanId
        ? this.userPlanId
        : this.generateId(),
      targetId,
      date: this.sessionDate.toISOString(),
      location: this.sessionLocation,

      notes: value.notes || undefined,
      exposureSeconds: value.exposureSeconds,
      isoGain: value.isoGain ?? null,
      filters: value.filters || undefined,
      bortle: value.bortle ?? null,
      lights: value.lights ?? null,
      darks: value.darks ?? null,
      flats: value.flats ?? null,
      biases: value.biases ?? null,
      darkFlats: value.darkFlats ?? null,
    };

    this.userPlanService.save(plan);
    this.router.navigate(['/main/plans']);
  }

  private generateId(): string {
    return 'plan_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
  }

  goBack() {
    this.nav.back();
  }
}