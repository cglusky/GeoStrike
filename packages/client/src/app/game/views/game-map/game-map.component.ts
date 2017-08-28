import { Component, Input, OnInit, ViewChild, HostListener } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { AcMapComponent, AcNotification, ViewerConfiguration, ActionType, GeoUtilsService } from 'angular-cesium';
import { GameFields } from '../../../types';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { CharacterService, MeModelState } from '../../services/character.service';
import { UtilsService } from '../../services/utils.service';

const matrix3Scratch = new Cesium.Matrix3();


@Component({
  selector: 'game-map',
  templateUrl: './game-map.component.html',
  providers: [
    ViewerConfiguration,
  ],
  styleUrls: ['./game-map.component.scss']
})
export class GameMapComponent implements OnInit {
  @Input() private playersPositions: Observable<AcNotification>;
  @Input() private gameData: Observable<GameFields.Fragment>;
  @ViewChild(AcMapComponent) private mapInstance: AcMapComponent;

  private viewer: any;

  constructor(private character: CharacterService, private viewerConf: ViewerConfiguration, private utils: UtilsService) {
    viewerConf.viewerOptions = {
      selectionIndicator: false,
      timeline: false,
      infoBox: false,
      fullscreenButton: false,
      baseLayerPicker: false,
      animation: false,
      homeButton: false,
      geocoder: false,
      navigationHelpButton: false,
      navigationInstructionsInitiallyVisible: false,
      terrainProviderViewModels: [],
    };

    viewerConf.viewerModifier = (viewer) => {
      this.viewer = viewer;
      viewer.scene.globe.depthTestAgainstTerrain = true;
      viewer.bottomContainer.remove();
      const screenSpaceCameraController = viewer.scene.screenSpaceCameraController;
      viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
      screenSpaceCameraController.enableTilt = false;
      screenSpaceCameraController.enableRotate = false;
      screenSpaceCameraController.enableZoom = false;
      const canvas = viewer.canvas;
      canvas.onclick = () => canvas.requestPointerLock();
    };
  }

  ngOnInit() {
    this.gameData.first().subscribe(value => {
      this.character.initCharacter({
        id: 'me',
        location: this.utils.getPosition(value.me.currentLocation.location),
        heading: value.me.currentLocation.heading,
        state: MeModelState.WALKING,
      });

      this.viewer.scene.preRender.addEventListener(this.preRenderHandler.bind(this));
    });
  }

  @HostListener('mousemove', ['$event'])
  onMousemove(event: MouseEvent) {
    if (!this.character.initialized) {
      return;
    }

    const heading = this.character.heading;
    this.character.heading = heading + (event.movementX / 10);
  }

  preRenderHandler() {
    if (!this.character.initialized) {
      return;
    }

    const heading = Cesium.Math.toRadians(-180 + this.character.heading);
    const pitch = Cesium.Math.toRadians(-10);
    const range = 10;
    const playerHead = Cesium.Cartesian3.add(this.character.location, new Cesium.Cartesian3(0, 0, 0), new Cesium.Cartesian3());

    this.viewer.camera.lookAt(playerHead, new Cesium.HeadingPitchRange(heading, pitch, range));
  }
}