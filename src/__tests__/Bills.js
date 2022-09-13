/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills.js";

import router from "../app/Router.js";

import mockStore from "../__mocks__/store";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      //to-do write expect expression

      // vérifier si l'icone est active return true ou false
      const iconIsActivated = windowIcon.classList.contains("active-icon");
      // console.log("iconIsActivated", iconIsActivated);
      expect(iconIsActivated).toBeTruthy(); // la resultat doit etre true
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
  });

  describe("When I am on Bills Page and I click on the icon eye", () => {
    test("Then should open the modal", () => {
      // page HTML bills
      document.body.innerHTML = BillsUI({ data: bills });

      // initialisation de bills
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const store = null;

      const billsList = new Bills({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });
      // simuler la modale
      $.fn.modal = jest.fn(); // function modal

      const icon = screen.getAllByTestId("icon-eye")[0];

      const handleClickIconEye = jest.fn(() =>
        billsList.handleClickIconEye(icon)
      );

      icon.addEventListener("click", handleClickIconEye);

      // Simuler le click an déclanchant l'événement
      fireEvent.click(icon);
      expect(handleClickIconEye).toHaveBeenCalled();
      const modale = document.getElementById("modaleFile");

      expect(modale).toBeTruthy();
    });
  });
});

//test d'intégration GET
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills page", () => {
    test("fetch bills from mock API GET", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "a@a" })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      //  on s'attend  que sur la page ya le text : Mes notes de frais
      await waitFor(() => screen.getByText("Mes notes de frais"));

      const tbody = document.querySelector("tbody");

      // et que le tbody à au moins 1 data
      expect(tbody.rows.length).toBeGreaterThan(0);
    });
  });
  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills");
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "a@a",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();
    });
    test("then fetches bills from an API and fails with 404 message error", async () => {
      mockStore.bills.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 404"))
      );
      const html = BillsUI({ error: "Erreur 404" });
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });

    test("then fetches messages from an API and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 500"))
      );
      const html = BillsUI({ error: "Erreur 500" });
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});
