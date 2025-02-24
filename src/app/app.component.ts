import { Component, HostListener, OnInit, signal, WritableSignal } from '@angular/core';
import { NativeUiService } from './core/service/native-ui.service';
import { UiData } from './core/interface/ui-data';
import { ElectricalPanelComponent } from '../electrical panel/electrical-panel.component';

/**
 * AppComponent handles the visibility of the electrical panel and listens to keyboard events for actions.
 */
@Component({
  selector: 'app-root',
  imports: [
    ElectricalPanelComponent
  ],
  template: `
    <!-- Displays the electrical panel when visible() signal is true -->
    @if (visible()) {
      <pre>{{ data }}</pre>
      <app-electrical-panel/>
    }
  `,
})
export class AppComponent implements OnInit {
  /**
   * A writable signal to control the visibility of the electrical panel.
   */
  visible: WritableSignal<boolean> = signal(false);

  data: UiData | undefined;

  /**
   * @param _nui - Injected service for interacting with the native UI.
   */
  constructor(
    private _nui: NativeUiService,
  ) {
  }

  /**
   * Initializes the component by subscribing to a message action and dispatching debug messages.
   * It updates the visibility based on received data and also simulates the behavior in the browser environment.
   */
  ngOnInit(): void {
    this._nui.fromMessageAction<UiData>('setVisible').subscribe({
      next: (data) => {
        // Sets the visibility based on the environment (browser or not)
        this.visible.set(this._nui.isEnvBrowser() ? true : data.visible!);
        console.log(`${AppComponent.name} DEBUG-DATA:`, data);
      },
    });

    // Dispatches debug messages to set the NUI visible during browser development
    this._nui.dispatchDebugMessages([
      {
        action: 'setVisible',
        data: true,
      },
    ]);
  }

  /**
   * Handles the 'Escape' key event to hide the electrical panel or frame.
   * @param event - The keyboard event.
   */
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (['Escape'].includes(event.code)) {
      // If not in browser environment, sends a 'hideFrame' message to the NUI
      if (!this._nui.isEnvBrowser()) {
        this._nui.fetchNui('hideFrame').then(r => {
        });
      }
      // Sets the visibility to false
      this.visible.set(false);
    }
  }
}
