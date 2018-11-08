import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DropdownComponent } from "./dropdown.component";

@NgModule({
    imports: [CommonModule, FormsModule],
    exports: [DropdownComponent],
    declarations: [DropdownComponent]
    })
    export class DropdownModule { }